/**
 * Common Email Templates - Simple and Professional
 * For educational system - no icons, no fancy colors
 */

/**
 * Base template structure
 * @param {Object} data - Email data
 * @param {string} data.title - Email title
 * @param {string} data.greeting - Greeting message
 * @param {string} data.content - Main content
 * @param {Array} data.infoItems - Array of {label, value} for info display
 * @param {string} data.footerNote - Optional footer note
 * @returns {string} HTML email template
 */
export const baseTemplate = (data) => {
    const { title, greeting, content, infoItems = [], footerNote, actionLinks = [] } = data;
    
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-container {
            background-color: #ffffff;
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
        }
        .email-header {
            background-color: #f8f9fa;
            border-bottom: 2px solid #333;
            padding: 20px;
        }
        .email-header h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
            color: #333;
        }
        .email-body {
            padding: 20px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 16px;
            color: #333;
        }
        .content {
            font-size: 14px;
            color: #555;
            margin-bottom: 20px;
            line-height: 1.8;
        }
        .info-section {
            background-color: #f8f9fa;
            border-left: 3px solid #333;
            padding: 16px;
            margin: 20px 0;
        }
        .info-item {
            margin: 8px 0;
            font-size: 14px;
        }
        .info-label {
            font-weight: 600;
            color: #333;
            display: inline-block;
            min-width: 100px;
        }
        .info-value {
            color: #555;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 16px 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
        }
        .footer p {
            margin: 4px 0;
        }
        .action-links {
            margin: 20px 0;
            padding: 16px;
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .action-link {
            display: inline-block;
            margin: 8px 8px 8px 0;
            padding: 10px 20px;
            background-color: #333;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            border: none;
        }
        .action-link:hover {
            background-color: #555;
            color: #ffffff !important;
        }
        .action-link.secondary {
            background-color: #6c757d;
            color: #ffffff !important;
        }
        .action-link.secondary:hover {
            background-color: #5a6268;
            color: #ffffff !important;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>${title}</h1>
        </div>
        
        <div class="email-body">
            <div class="greeting">
                ${greeting}
            </div>
            
            <div class="content">
                ${content}
            </div>
            
            ${infoItems.length > 0 ? `
            <div class="info-section">
                ${infoItems.map(item => `
                    <div class="info-item">
                        <span class="info-label">${item.label}:</span>
                        <span class="info-value">${item.value}</span>
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${actionLinks && actionLinks.length > 0 ? `
            <div class="action-links">
                ${actionLinks.map(link => `
                    <a href="${link.url}" class="action-link ${link.secondary ? 'secondary' : ''}" target="_blank" style="display: inline-block; margin: 8px 8px 8px 0; padding: 10px 20px; background-color: ${link.secondary ? '#6c757d' : '#333'}; color: #ffffff !important; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500; border: none;">
                        ${link.text}
                    </a>
                `).join('')}
            </div>
            ` : ''}
            
            ${footerNote ? `
            <div class="content" style="margin-top: 20px; font-size: 13px; color: #666;">
                ${footerNote}
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p><strong>Hệ thống Quản lý Capstone Project</strong></p>
            <p>Email này được gửi tự động từ hệ thống. Vui lòng không trả lời email này.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
};

export default {
    baseTemplate
};

