import React from 'react';

interface FormattedMessageProps {
  content: string;
}

export function FormattedMessage({ content }: FormattedMessageProps) {
  // 볼드 텍스트 처리 (**텍스트**)
  const processBoldText = (text: string) => {
    return text.split(/(\*\*[^*]+\*\*)/).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return <strong key={index} className="font-semibold text-foreground">{boldText}</strong>;
      }
      return part;
    });
  };

  // 표 형식 데이터 감지 및 처리
  const detectAndFormatTable = (text: string) => {
    const lines = text.split('\n');
    const tableLines: string[] = [];
    const nonTableLines: string[] = [];
    let inTable = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 표 시작 감지: 콜론이나 구분자가 있는 패턴
      if (line.includes(':') || line.includes('|') || line.includes('-')) {
        // 여러 항목이 콜론으로 구분된 경우
        if (line.includes(':') && !inTable) {
          // 연속된 콜론 라인들을 찾아 표로 만들기
          const startIndex = i;
          const potentialTableLines = [];
          
          for (let j = i; j < lines.length; j++) {
            const currentLine = lines[j].trim();
            if (currentLine.includes(':') || currentLine === '') {
              potentialTableLines.push(currentLine);
            } else {
              break;
            }
          }
          
          // 최소 2개 이상의 데이터 라인이 있으면 표로 처리
          const dataLines = potentialTableLines.filter(l => l.includes(':'));
          if (dataLines.length >= 2) {
            tableLines.push(...potentialTableLines);
            i += potentialTableLines.length - 1;
            inTable = true;
            continue;
          }
        }
      }
      
      if (!inTable) {
        nonTableLines.push(line);
      } else {
        inTable = false;
      }
    }

    return { tableLines, nonTableLines };
  };

  const { tableLines, nonTableLines } = detectAndFormatTable(content);

  // 표 데이터 생성
  const createTable = (lines: string[]) => {
    const rows = lines
      .filter(line => line.trim() && line.includes(':'))
      .map(line => {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        return { key: key.trim(), value };
      });

    if (rows.length === 0) return null;

    return (
      <div className="mt-3 mb-3">
        <table className="w-full border-collapse border border-border rounded-md">
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-muted/30' : 'bg-background'}>
                <td className="border border-border px-3 py-2 font-medium text-sm bg-muted/50">
                  {processBoldText(row.key)}
                </td>
                <td className="border border-border px-3 py-2 text-sm">
                  {processBoldText(row.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // 일반 텍스트 포맷팅 (볼드 처리 + 줄바꿈)
  const formatNormalText = (text: string) => {
    return text.split('\n').map((line, index) => (
      <div key={index} className={line.trim() === '' ? 'h-2' : ''}>
        {line.trim() === '' ? null : processBoldText(line)}
      </div>
    ));
  };

  // 표와 일반 텍스트가 섞인 경우 처리
  if (tableLines.length > 0) {
    const beforeTable = content.split(tableLines[0])[0];
    const afterTableIndex = content.lastIndexOf(tableLines[tableLines.length - 1]) + tableLines[tableLines.length - 1].length;
    const afterTable = content.substring(afterTableIndex);

    return (
      <div className="space-y-2">
        {beforeTable.trim() && (
          <div>{formatNormalText(beforeTable.trim())}</div>
        )}
        {createTable(tableLines)}
        {afterTable.trim() && (
          <div>{formatNormalText(afterTable.trim())}</div>
        )}
      </div>
    );
  }

  // 표가 없는 경우 일반 텍스트만 처리
  return <div className="space-y-1">{formatNormalText(content)}</div>;
}