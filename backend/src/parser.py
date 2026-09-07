import os
from pathlib import Path
from typing import List, Dict, Any, Optional

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
except Exception as e:
    # Tree-sitter not yet available or C extension issue; fallback will be used
    HAS_TREE_SITTER = False


def _extract_tree_sitter_chunks(code_bytes: bytes, language: str, rel_path: str) -> List[Dict[str, Any]]:
    """
    Uses Tree-sitter to parse source code into an Abstract Syntax Tree (AST)
    and extract complete class and function definitions.
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
        return []

    tree = parser.parse(code_bytes)
    root_node = tree.root_node
    chunks = []

    def get_node_name(node, lang):
        """Finds the identifier/name of a class or function node."""
        for child in node.children:
            if child.type in ("identifier", "name", "property_identifier"):
                return code_bytes[child.start_byte:child.end_byte].decode("utf-8", errors="replace")
        return "anonymous"

    def traverse(node):
        if node.type in target_node_types:
            start_row = node.start_point[0] + 1  # 1-indexed line
            end_row = node.end_point[0] + 1
            node_code = code_bytes[node.start_byte:node.end_byte].decode("utf-8", errors="replace")
            entity_name = get_node_name(node, language)
            
            # Identify whether this is a class or function
            entity_type = "class" if "class" in node.type else "function"

            chunks.append({
                "chunk_id": f"{rel_path}#{entity_type}_{entity_name}:{start_row}-{end_row}",
                "file_path": rel_path,
                "entity_type": entity_type,
                "entity_name": entity_name,
                "start_line": start_row,
                "end_line": end_row,
                "code": node_code.strip()
            })

            # For classes, we still traverse inside to also capture nested methods!
            if entity_type == "class":
                for child in node.children:
                    traverse(child)
            return

        for child in node.children:
            traverse(child)

    traverse(root_node)
    return chunks


def _fallback_line_chunker(code_text: str, rel_path: str, max_lines: int = 60, overlap: int = 10) -> List[Dict[str, Any]]:
    """
    Fallback chunker for languages without Tree-sitter grammars (e.g. Markdown, HTML, CSS).
    Splits text by sensible line blocks with slight overlap so context isn't lost.
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
                "code": chunk_code
            })

        if end == total_lines:
            break
        start += (max_lines - overlap)

    return chunks


def chunk_file(file_path: str, repo_root: str) -> List[Dict[str, Any]]:
    """
    Primary entry point: Takes a source file path and its repository root,
    reads the content, and returns semantic AST chunks.
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
        return []

    ext = path_obj.suffix.lower()

    # If Tree-sitter is installed and language is supported, use AST parsing
    if HAS_TREE_SITTER:
        if ext == ".py":
            ast_chunks = _extract_tree_sitter_chunks(code_bytes, "python", rel_path)
            if ast_chunks:
                return ast_chunks
        elif ext in (".js", ".jsx", ".ts", ".tsx"):
            ast_chunks = _extract_tree_sitter_chunks(code_bytes, "javascript", rel_path)
            if ast_chunks:
                return ast_chunks

    # Fallback to smart line chunker if AST didn't produce chunks or not supported
    code_text = code_bytes.decode("utf-8", errors="replace")
    return _fallback_line_chunker(code_text, rel_path)
