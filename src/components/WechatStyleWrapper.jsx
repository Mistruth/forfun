import React from 'react';

const WechatStyleWrapper = ({ children }) => {
  return (
    <div 
      className="wechat-article"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: '#333',
        lineHeight: '1.8',
        fontSize: '16px',
      }}
    >
      <style>{`
        .wechat-article h1 {
          font-size: 24px;
          font-weight: bold;
          margin: 20px 0 15px 0;
          color: '#333';
          line-height: 1.4;
        }
        .wechat-article h2 {
          font-size: 20px;
          font-weight: bold;
          margin: 18px 0 12px 0;
          color: '#333';
          line-height: 1.4;
        }
        .wechat-article h3 {
          font-size: 18px;
          font-weight: bold;
          margin: 16px 0 10px 0;
          color: '#333';
          line-height: 1.4;
        }
        .wechat-article p {
          margin: 12px 0;
          text-align: justify;
        }
        .wechat-article ul, .wechat-article ol {
          padding-left: 2em;
          margin: 12px 0;
        }
        .wechat-article li {
          margin: 6px 0;
        }
        .wechat-article blockquote {
          border-left: 4px solid #07c160;
          padding: 10px 15px;
          margin: 15px 0;
          background-color: #f7f7f7;
          color: #666;
        }
        .wechat-article code {
          background-color: #f7f7f7;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: "Courier New", monospace;
          font-size: 14px;
        }
        .wechat-article pre {
          background-color: #f7f7f7;
          padding: 15px;
          border-radius: 5px;
          overflow-x: auto;
          margin: 15px 0;
        }
        .wechat-article pre code {
          background-color: transparent;
          padding: 0;
        }
        .wechat-article img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 15px auto;
        }
        .wechat-article a {
          color: #07c160;
          text-decoration: none;
        }
        .wechat-article a:hover {
          text-decoration: underline;
        }
        .wechat-article hr {
          border: none;
          border-top: 1px solid #e5e5e5;
          margin: 20px 0;
        }
        .wechat-article table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        .wechat-article th, .wechat-article td {
          border: 1px solid #e5e5e5;
          padding: 10px;
          text-align: left;
        }
        .wechat-article th {
          background-color: #f7f7f7;
          font-weight: bold;
        }
        .wechat-article strong {
          color: #333;
          font-weight: bold;
        }
        .wechat-article em {
          font-style: italic;
        }
      `}</style>
      {children}
    </div>
  );
};

export default WechatStyleWrapper;
