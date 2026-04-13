#!/usr/bin/env python3
import glob

# Find all files and check/normalize line endings
files = glob.glob(r'c:\Users\Yusuf\OneDrive\Desktop\matjri - Copy\resources\js\**\*', recursive=True)
files = [f for f in files if f.endswith(('.tsx', '.ts', '.jsx', '.js'))]

count = 0
for file_path in files:
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
        
        original = content
        
        # Convert all CRLF to LF
        content = content.replace(b'\r\n', b'\n')
        
        if content != original:
            with open(file_path, 'wb') as f:
                f.write(content)
            count += 1
    except:
        pass

print(f"Normalized {count} files to use LF line endings")
