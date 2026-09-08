"""
===============================================================================
FILE: backend/src/parser.py
MODULE: Tree-sitter Abstract Syntax Tree (AST) & Dependency Call Graph Extractor

WHAT THIS FILE DOES:
--------------------
This module provides multi-language syntax parsing and structural code analysis.
It performs two foundational roles in our Graph-Augmented RAG architecture:
1. Semantic AST Chunking:
   - Slices code by complete functions, methods, and classes rather than arbitrary
     line counts. This preserves logical boundaries, docstrings, and comments.
2. Topological Call Graph & Import Extraction (GraphRAG):
   - Inspects AST syntax trees to extract caller-to-callee function invocations
     (`call` in Python, `call_expression` in JS/TS).
   - Extracts module-level imports (`import_statement`, `import_from_statement`).
   - Generates directional relationship edges (`caller -> callee` with `CALLS`
     and `file -> module` with `IMPORTS`) to populate the SQLite dependency graph.
===============================================================================
"""

import os
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional, Set

# Attempt to load Tree-sitter and language packs
HAS_TREE_SITTER = False
try:
    from tree_sitter import Language, Parser
    import tree_sitter_python as tspython
    import tree_sitter_javascript as tsjavascript

    # Initialize languages
    PY_LANGUAGE = Language(tspython.language())
    JS_LANGUAGE = Language(tsjavascript.language())
    HAS_TREE_SITTER = True
except Exception:
    # Tree-sitter not available or C extension issue; fallback will be used
    HAS_TREE_SITTER = False


def _get_node_text(node, code_bytes: bytes) -> str:
    """Extracts decoded text of an AST node."""
    return code_bytes[node.start_byte:node.end_byte].decode("utf-8", errors="replace").strip()


def _extract_calls_from_node(node, language: str, code_bytes: bytes) -> List[str]:
    """Recursively traverses a function or method AST subtree to discover all function calls."""
    calls = []
    target_type = "call" if language == "python" else "call_expression"

    if node.type == target_type:
        fn_node = node.child_by_field_name("function")
        if fn_node:
            call_text = _get_node_text(fn_node, code_bytes)
            # Filter out language control keywords or invalid identifiers
            if call_text and call_text not in ("if", "for", "while", "return", "throw", "console.log"):
                calls.append(call_text)

    for child in node.children:
        calls.extend(_extract_calls_from_node(child, language, code_bytes))

    return calls


def _extract_imports(root_node, language: str, rel_path: str, code_bytes: bytes) -> List[Dict[str, Any]]:
    """Extracts module-level imports from the root of the syntax tree."""
    dependencies = []

    for child in root_node.children:
        # Python: import foo, from foo import bar
        if language == "python":
            if child.type == "import_statement":
                # import foo, bar
                for name_node in child.children:
                    if name_node.type == "dotted_name":
                        module_name = _get_node_text(name_node, code_bytes)
                        dependencies.append({
                            "source_file": rel_path,
                            "source_entity": "file",
                            "target_file": module_name,
                            "target_entity": module_name,
                            "relation_type": "IMPORTS"
                        })
            elif child.type == "import_from_statement":
                # from module import symbol1, symbol2
                module_node = child.child_by_field_name("module_name")
                module_name = _get_node_text(module_node, code_bytes) if module_node else "unknown"
                for sub in child.children:
                    if sub.type == "dotted_name" and sub != module_node:
                        symbol = _get_node_text(sub, code_bytes)
                        dependencies.append({
                            "source_file": rel_path,
                            "source_entity": "file",
                            "target_file": module_name,
                            "target_entity": symbol,
                            "relation_type": "IMPORTS"
                        })

        # JavaScript / TypeScript: import { a, b } from "module"
        elif language in ("javascript", "typescript"):
            if child.type == "import_statement":
                source = None
                imported_symbols = []
                for c in child.children:
                    if c.type in ("string", "string_fragment"):
                        source = _get_node_text(c, code_bytes).strip("\"'")
                    elif c.type == "import_clause":
                        for spec in c.children:
                            if spec.type == "named_imports":
                                for n in spec.children:
                                    if n.type == "import_specifier":
                                        imported_symbols.append(_get_node_text(n, code_bytes))
                            elif spec.type == "identifier":
                                imported_symbols.append(_get_node_text(spec, code_bytes))

                if source:
                    for symbol in imported_symbols:
                        dependencies.append({
                            "source_file": rel_path,
                            "source_entity": "file",
                            "target_file": source,
                            "target_entity": symbol,
                            "relation_type": "IMPORTS"
                        })

    return dependencies


def _extract_tree_sitter_chunks(
    code_bytes: bytes,
    language: str,
    rel_path: str
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Uses Tree-sitter to parse source code into an Abstract Syntax Tree (AST),
    extracting complete class and function definitions as well as call dependencies.
    """
    parser = Parser()
    if language == "python":
        parser.language = PY_LANGUAGE
        target_node_types = {"function_definition", "class_definition"}
    elif language in ("javascript", "typescript"):
        parser.language = JS_LANGUAGE
        target_node_types = {
            "function_declaration", "class_declaration",
            "method_definition", "arrow_function"
        }
    else:
        return [], []

    tree = parser.parse(code_bytes)
    root_node = tree.root_node
    chunks = []
    dependencies = _extract_imports(root_node, language, rel_path, code_bytes)

    def get_node_name(node, lang):
        """Finds the identifier/name of a class or function node."""
        for child in node.children:
            if child.type in ("identifier", "name", "property_identifier"):
                return _get_node_text(child, code_bytes)
        return "anonymous"

    def traverse(node):
        if node.type in target_node_types:
            start_row = node.start_point[0] + 1  # 1-indexed line
            end_row = node.end_point[0] + 1
            node_code = _get_node_text(node, code_bytes)
            entity_name = get_node_name(node, language)
            
            # Identify whether this is a class or function
            entity_type = "class" if "class" in node.type else "function"

            # Extract all call expressions invoked inside this function
            fn_calls = _extract_calls_from_node(node, language, code_bytes)
            unique_calls = sorted(list(set(fn_calls)))

            for call_name in unique_calls:
                dependencies.append({
                    "source_file": rel_path,
                    "source_entity": entity_name,
                    "target_file": None,
                    "target_entity": call_name,
                    "relation_type": "CALLS"
                })

            chunks.append({
                "chunk_id": f"{rel_path}#{entity_type}_{entity_name}:{start_row}-{end_row}",
                "file_path": rel_path,
                "entity_type": entity_type,
                "entity_name": entity_name,
                "start_line": start_row,
                "end_line": end_row,
                "code": node_code,
                "calls": unique_calls
            })

            # For classes, continue traversing to capture nested methods
            if entity_type == "class":
                for child in node.children:
                    traverse(child)
            return

        for child in node.children:
            traverse(child)

    traverse(root_node)
    return chunks, dependencies


def _fallback_line_chunker(
    code_text: str,
    rel_path: str,
    max_lines: int = 80,
    overlap: int = 15
) -> List[Dict[str, Any]]:
    """
    Fallback chunker for non-code files (Markdown, HTML, CSS).
    Splits text into line blocks with slight overlap so context is retained.
    """
    lines = code_text.splitlines()
    if not lines:
        return []

    chunks = []
    total_lines = len(lines)
    start = 0

    while start < total_lines:
        end = min(start + max_lines, total_lines)
        chunk_lines = lines[start:end]
        chunk_code = "\n".join(chunk_lines).strip()

        if chunk_code:
            chunks.append({
                "chunk_id": f"{rel_path}#block:{start + 1}-{end}",
                "file_path": rel_path,
                "entity_type": "block",
                "entity_name": f"lines_{start + 1}_{end}",
                "start_line": start + 1,
                "end_line": end,
                "code": chunk_code,
                "calls": []
            })

        if end == total_lines:
            break
        start += (max_lines - overlap)

    return chunks


def parse_file_ast(file_path: str, repo_root: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Parses a source code file into AST chunks and extracted dependency edges.
    Returns: (chunks, dependencies)
    """
    path_obj = Path(file_path)
    try:
        rel_path = path_obj.relative_to(repo_root).as_posix()
    except ValueError:
        rel_path = path_obj.name

    try:
        with open(file_path, "rb") as f:
            code_bytes = f.read()
    except Exception as e:
        print(f"[Parser] Error reading {file_path}: {e}")
        return [], []

    ext = path_obj.suffix.lower()

    if HAS_TREE_SITTER:
        if ext == ".py":
            ast_chunks, deps = _extract_tree_sitter_chunks(code_bytes, "python", rel_path)
            if ast_chunks:
                return ast_chunks, deps
        elif ext in (".js", ".jsx", ".ts", ".tsx"):
            ast_chunks, deps = _extract_tree_sitter_chunks(code_bytes, "javascript", rel_path)
            if ast_chunks:
                return ast_chunks, deps

    # Fallback for non-AST languages or files without function nodes
    code_text = code_bytes.decode("utf-8", errors="replace")
    fallback_chunks = _fallback_line_chunker(code_text, rel_path)
    return fallback_chunks, []


def chunk_file(file_path: str, repo_root: str) -> List[Dict[str, Any]]:
    """Backward-compatible entry point returning just the chunks."""
    chunks, _ = parse_file_ast(file_path, repo_root)
    return chunks

