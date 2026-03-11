const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, 'docs');
const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));

const dateStr = '2026-03-11';
const versionStr = '1.1.0';

files.forEach(file => {
    const filePath = path.join(docsDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Remove existing Date/Version if any
    content = content.replace(/\*\*撰寫日期\*\*:.*\n/g, '');
    content = content.replace(/\*\*版本號\*\*:.*\n/g, '');

    // Insert Date and Version after the first heading or at the top
    const lines = content.split('\n');
    let insertIdx = 0;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('# ')) {
            insertIdx = i + 1;
            break;
        }
    }

    const metadata = `\n**撰寫日期**: ${dateStr}\n**版本號**: ${versionStr}\n`;
    lines.splice(insertIdx, 0, metadata);

    content = lines.join('\n');

    // Check for required sections
    const requiredSections = [
        { regex: /## \d+\.\s*功能概述/, default: '## 1. 功能概述 (Feature Overview)\n\n此頁面提供核心功能的概覽。\n' },
        { regex: /## \d+\.\s*技術實作/, default: '## 2. 技術實作 (Technical Implementation)\n\n描述資料獲取與狀態管理邏輯。\n' },
        { regex: /## \d+\.\s*UI\/?UX\s*排版設計/i, default: '## 3. UI/UX 排版設計 (UI Layout)\n\n說明畫面佈局與互動設計。\n' },
        { regex: /## \d+\.\s*模組依賴/, default: '## 4. 模組依賴 (Module Dependencies)\n\n列出相關的組件與 Hooks。\n' }
    ];

    let sectionAppended = false;
    requiredSections.forEach(sec => {
        if (!sec.regex.test(content)) {
            content += '\n' + sec.default;
            sectionAppended = true;
        }
    });

    // Optionally add a mermaid diagram if it's a PAGE and doesn't have one
    if (file.startsWith('PAGE_') && !content.includes('```mermaid')) {
        content += `\n## 5. 工作流程圖 (Workflow Diagram)\n\n\`\`\`mermaid\ngraph TD\n    A[進入頁面] --> B{載入資料}\n    B -->|成功| C[渲染畫面與圖表]\n    B -->|失敗| D[顯示錯誤提示]\n    C --> E[使用者互動/篩選]\n    E --> C\n\`\`\`\n`;
    }

    // Clean up multiple empty lines
    content = content.replace(/\n{3,}/g, '\n\n');

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${file}`);
});
