import os
import re

src_dir = "/home/lance/Documents/FM/Webapp-FestManager/Webapp-FestManager/src"
wiki_dir = "/home/lance/Documents/FM/Webapp-FestManager/Webapp-FestManager/docs/wiki/codebase"

os.makedirs(wiki_dir, exist_ok=True)

# Regex to find export functions, interfaces, contexts, etc.
export_func_rx = re.compile(r'export\s+(const|function|interface|type|class|enum)\s+(\w+)')

def analyze_file(filepath):
    rel_path = os.path.relpath(filepath, src_dir)
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Extract exports
    exports = export_func_rx.findall(content)
    export_names = [e[1] for e in exports]
    
    # Try to extract leading comment or overview description
    desc = ""
    lines = content.split('\n')
    comment_lines = []
    for line in lines[:15]:
        stripped = line.strip()
        if stripped.startswith('//'):
            comment_lines.append(stripped.replace('//', '').strip())
        elif stripped.startswith('/*') or stripped.startswith('*'):
            comment_lines.append(stripped.replace('/*', '').replace('*/', '').replace('*', '').strip())
        elif stripped == "" and comment_lines:
            break
    
    if comment_lines:
        desc = " ".join(comment_lines).strip()
    else:
        desc = f"File {rel_path} in codebase."
        
    return rel_path, desc, export_names

def generate_wiki():
    codebase_index = []
    
    for root, dirs, files in os.walk(src_dir):
        # Ignore assets, test, or directories starting with .
        if any(p in root.split(os.sep) for p in ['assets', 'test']) or any(d.startswith('.') for d in root.split(os.sep)):
            continue
            
        for file in files:
            if not file.endswith(('.ts', '.tsx', '.css')):
                continue
                
            filepath = os.path.join(root, file)
            rel_path, desc, exports = analyze_file(filepath)
            
            # Create a wiki name, e.g. src/hooks/queries/useClientsQuery.ts -> code-hooks-queries-useClientsQuery
            wiki_filename = "code-" + rel_path.replace('/', '-').replace('\\', '-').replace('.ts', '').replace('.tsx', '').replace('.css', '') + ".md"
            wiki_filepath = os.path.join(wiki_dir, wiki_filename)
            wiki_title = rel_path
            
            # Write individual file doc
            with open(wiki_filepath, 'w', encoding='utf-8') as wf:
                wf.write(f"# `{rel_path}`\n\n")
                wf.write(f"**Đường dẫn**: `src/{rel_path}`\n\n")
                wf.write(f"## 📝 Mô tả\n{desc}\n\n")
                if exports:
                    wf.write("## 📦 Các Exports chính\n")
                    for exp in exports:
                        wf.write(f"- `{exp}`\n")
                    wf.write("\n")
                wf.write("## 🔗 Liên kết liên quan\n")
                wf.write("- [[index|Quay lại trang chủ Second Brain]]\n")
                wf.write("- [[codebase-index|Danh mục Codebase]]\n")
            
            codebase_index.append((rel_path, wiki_filename, desc))
            
    # Write codebase-index.md
    index_path = os.path.join(wiki_dir, "../codebase-index.md")
    with open(index_path, 'w', encoding='utf-8') as ifile:
        ifile.write("# Danh mục Codebase (Codebase Index)\n\n")
        ifile.write("Dưới đây là danh sách toàn bộ các file nguồn trong dự án được quét tự động. Mỗi file đều có trang Wiki tương ứng để theo dõi chi tiết:\n\n")
        
        # Group by category
        categories = {}
        for rel_path, wiki_filename, desc in codebase_index:
            parts = rel_path.split('/')
            category = parts[0] if len(parts) > 1 else 'root'
            if category not in categories:
                categories[category] = []
            categories[category].append((rel_path, wiki_filename.replace('.md', ''), desc))
            
        for cat, items in sorted(categories.items()):
            ifile.write(f"## 📂 `{cat}/`\n")
            for rel_path, wiki_name, desc in sorted(items):
                ifile.write(f"- [[{wiki_name}|{os.path.basename(rel_path)}]] — *{desc}*\n")
            ifile.write("\n")
            
        ifile.write("---\n")
        ifile.write("- [[index|Quay lại trang chủ Second Brain]]\n")

    print(f"Successfully generated {len(codebase_index)} codebase wiki pages.")

if __name__ == "__main__":
    generate_wiki()
