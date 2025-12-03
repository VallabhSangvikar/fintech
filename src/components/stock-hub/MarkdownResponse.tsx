'use client';

import React, { JSX } from 'react';

interface MarkdownResponseProps {
  content: string;
}

export default function MarkdownResponse({ content }: MarkdownResponseProps) {
  // Parse text with **bold** and return JSX
  const parseInlineFormatting = (text: string) => {
    const parts = text.split('**');
    return parts.map((part, idx) =>
      idx % 2 === 1 ? (
        <strong key={idx} className="text-white font-bold">
          {part}
        </strong>
      ) : (
        <span key={idx}>{part}</span>
      )
    );
  };
  // Parse markdown-like content and render with proper styling
  const renderContent = () => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let currentList: string[] = [];
    let inCodeBlock = false;
    let codeLines: string[] = [];

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="my-3 ml-4 space-y-1.5">
            {currentList.map((item, idx) => {
              const hasCheck = item.startsWith('✅');
              const hasCross = item.startsWith('⚠️') || item.startsWith('❌');
              return (
                <li key={idx} className={`text-gray-300 leading-relaxed flex items-start gap-2 ${
                  hasCheck ? 'text-green-400' : hasCross ? 'text-yellow-400' : ''
                }`}>
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0"></span>
                  <span className="flex-1">{parseInlineFormatting(item)}</span>
                </li>
              );
            })}
          </ul>
        );
        currentList = [];
      }
    };

    const flushCodeBlock = () => {
      if (codeLines.length > 0) {
        elements.push(
          <pre key={`code-${elements.length}`} className="my-4 p-4 bg-black/30 rounded-lg overflow-x-auto">
            <code className="text-sm text-green-400">{codeLines.join('\n')}</code>
          </pre>
        );
        codeLines = [];
      }
    };

    lines.forEach((line, index) => {
      // Code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock();
        }
        inCodeBlock = !inCodeBlock;
        return;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        return;
      }

      // Headers
      if (line.startsWith('### ')) {
        flushList();
        const headerText = line.replace('### ', '');
        elements.push(
          <h3 key={`h3-${index}`} className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mt-6 mb-3">
            {headerText}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={`h2-${index}`} className="text-2xl font-bold text-white mt-6 mb-4">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={`h1-${index}`} className="text-3xl font-bold text-white mt-6 mb-4">
            {line.replace('# ', '')}
          </h1>
        );
      }
      // Bullet points (both * and -)
      else if (line.trim().match(/^[\*\-]\s+/)) {
        currentList.push(line.trim().replace(/^[\*\-]\s+/, ''));
      }
      // Bold text **text**
      else if (line.includes('**')) {
        flushList();
        const parts = line.split('**');
        elements.push(
          <p key={`p-${index}`} className="text-gray-300 my-2 leading-relaxed">
            {parts.map((part, idx) =>
              idx % 2 === 1 ? (
                <strong key={idx} className="text-white font-semibold">
                  {part}
                </strong>
              ) : (
                <span key={idx}>{part}</span>
              )
            )}
          </p>
        );
      }
      // Regular paragraphs
      else if (line.trim()) {
        flushList();
        // Check for emojis and highlights
        const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(line);
        elements.push(
          <p key={`p-${index}`} className={`text-gray-300 my-2 leading-relaxed ${hasEmoji ? 'flex items-start gap-2' : ''}`}>
            {line}
          </p>
        );
      }
      // Empty line
      else {
        flushList();
      }
    });

    flushList();
    flushCodeBlock();

    return elements;
  };

  return <div className="markdown-content space-y-1">{renderContent()}</div>;
}
