import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Upload, Download, Search, X, CheckSquare, Square, Filter, HelpCircle, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';

export default function JsonExtractor() {
  const [mode, setMode] = useState('extract'); // 'extract' or 'compare'
  const [jsonData, setJsonData] = useState([]);
  const [jsonDataB, setJsonDataB] = useState([]);
  const [allKeys, setAllKeys] = useState([]);
  const [allKeysB, setAllKeysB] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [errorB, setErrorB] = useState('');
  const [hideEmpty, setHideEmpty] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [previewCount, setPreviewCount] = useState(3);
  const [exportMode, setExportMode] = useState('all'); // 'all', 'common', 'differences'
  const tooltipRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  const parseConsoleFormat = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const obj = {};
    
    let i = 0;
    while (i < lines.length) {
      let currentLine = lines[i];
      
      if (i + 1 < lines.length && lines[i + 1] === ':') {
        let key = currentLine.replace(/^\*+/, '').trim().replace(/^["']|["']$/g, '');
        
        if (i + 2 < lines.length) {
          let value = lines[i + 2].trim();
          
          if (value === '""' || value === "''") {
            value = '';
          } else if (value.startsWith('(') && value.includes('[')) {
            const match = value.match(/\[(.+)\]/);
            if (match) {
              try {
                value = JSON.parse('[' + match[1] + ']');
              } catch {
                value = match[1];
              }
            }
          } else if (value.startsWith('{') && value.endsWith('}')) {
            value = value;
          } else if (value === 'null') {
            value = null;
          } else if (value === 'true') {
            value = true;
          } else if (value === 'false') {
            value = false;
          } else if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          } else if (!isNaN(value) && value !== '') {
            value = Number(value);
          }
          
          if (key) {
            obj[key] = value;
          }
          
          i += 3;
          continue;
        }
      }
      
      const colonIndex = currentLine.indexOf(':');
      if (colonIndex !== -1) {
        let key = currentLine.substring(0, colonIndex).trim();
        let value = currentLine.substring(colonIndex + 1).trim();
        
        key = key.replace(/^\*+/, '').trim().replace(/^["']|["']$/g, '');
        
        if (key) {
          if (value === '""' || value === "''") {
            value = '';
          } else if (value === 'null') {
            value = null;
          } else if (value === 'true') {
            value = true;
          } else if (value === 'false') {
            value = false;
          } else if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          } else if (!isNaN(value) && value !== '') {
            value = Number(value);
          }
          
          obj[key] = value;
        }
      }
      
      i++;
    }
    
    return obj;
  };

  const handlePaste = (e, isDatasetB = false) => {
    const text = e.target.value;
    const setData = isDatasetB ? setJsonDataB : setJsonData;
    const setKeys = isDatasetB ? setAllKeysB : setAllKeys;
    const setErr = isDatasetB ? setErrorB : setError;

    if (!text.trim()) {
      setData([]);
      setKeys([]);
      if (!isDatasetB) setSelectedKeys(new Set());
      setErr('');
      return;
    }

    try {
      let dataArray;
      let cleanedText = text.trim();
      
      try {
        const parsed = JSON.parse(cleanedText);
        dataArray = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        try {
          cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          const parsed = JSON.parse(cleanedText);
          dataArray = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          try {
            const parsed = parseConsoleFormat(cleanedText);
            if (Object.keys(parsed).length === 0) {
              setErr('No data with values found. Make sure to paste the full object.');
              return;
            }
            dataArray = [parsed];
          } catch {
            setErr('Unable to parse the data. Try copying the object directly from your console.');
            return;
          }
        }
      }
      
      if (!dataArray || dataArray.length === 0) {
        setErr('No data found. Please paste a JSON object or array.');
        return;
      }
      
      const keySet = new Set();
      dataArray.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(key => keySet.add(key));
        }
      });
      
      if (keySet.size === 0) {
        setErr('No fields found in the data. Make sure you\'re pasting valid data.');
        return;
      }
      
      const sortedKeys = Array.from(keySet).sort();
      
      setData(dataArray);
      setKeys(sortedKeys);
      
      if (mode === 'extract' && !isDatasetB) {
        setSelectedKeys(new Set(sortedKeys));
      }
      
      setErr('');
    } catch (err) {
      setErr('Unable to parse the data. Try copying the object directly from your console.');
    }
  };

  // Comparison field analysis
  const comparisonAnalysis = useMemo(() => {
    if (mode !== 'compare') return null;

    const keysA = new Set(allKeys);
    const keysB = new Set(allKeysB);
    const allUniqueKeys = new Set([...allKeys, ...allKeysB]);
    
    const analysis = {};
    
    allUniqueKeys.forEach(key => {
      const inA = keysA.has(key);
      const inB = keysB.has(key);
      
      let countA = 0;
      let countB = 0;
      const typesA = new Set();
      const typesB = new Set();
      const samplesA = [];
      const samplesB = [];
      const valuesA = new Set();
      const valuesB = new Set();
      
      if (inA) {
        jsonData.forEach(item => {
          if (key in item && item[key] !== '' && item[key] !== null && item[key] !== undefined) {
            countA++;
            typesA.add(typeof item[key]);
            if (samplesA.length < 3) {
              samplesA.push(item[key]);
            }
            // Store serialized values for comparison
            valuesA.add(JSON.stringify(item[key]));
          }
        });
      }
      
      if (inB) {
        jsonDataB.forEach(item => {
          if (key in item && item[key] !== '' && item[key] !== null && item[key] !== undefined) {
            countB++;
            typesB.add(typeof item[key]);
            if (samplesB.length < 3) {
              samplesB.push(item[key]);
            }
            // Store serialized values for comparison
            valuesB.add(JSON.stringify(item[key]));
          }
        });
      }
      
      // Check if values differ between datasets
      const valuesDiffer = inA && inB && valuesA.size > 0 && valuesB.size > 0 && 
                          !Array.from(valuesA).every(v => valuesB.has(v));
      
      analysis[key] = {
        inA,
        inB,
        countA,
        countB,
        typesA: Array.from(typesA),
        typesB: Array.from(typesB),
        samplesA,
        samplesB,
        status: inA && inB ? 'both' : inA ? 'onlyA' : 'onlyB',
        typeMismatch: inA && inB && typesA.size > 0 && typesB.size > 0 && 
                      (typesA.size > 1 || typesB.size > 1 || Array.from(typesA)[0] !== Array.from(typesB)[0]),
        valuesDiffer
      };
    });
    
    return analysis;
  }, [mode, allKeys, allKeysB, jsonData, jsonDataB]);

  // Update selected keys when switching to compare mode
  useEffect(() => {
    if (mode === 'compare' && comparisonAnalysis) {
      const allCompareKeys = Object.keys(comparisonAnalysis);
      setSelectedKeys(new Set(allCompareKeys));
    }
  }, [mode, comparisonAnalysis]);

  // Calculate field occurrences for extract mode
  const fieldStats = useMemo(() => {
    if (mode === 'compare') return {};
    
    const stats = {};
    allKeys.forEach(key => {
      let count = 0;
      const types = new Set();
      jsonData.forEach(item => {
        if (key in item && item[key] !== '' && item[key] !== null && item[key] !== undefined) {
          count++;
          types.add(typeof item[key]);
        }
      });
      stats[key] = { count, types: Array.from(types) };
    });
    return stats;
  }, [mode, allKeys, jsonData]);

  // Group fields by common prefixes
  const groupedFields = useMemo(() => {
    const keys = mode === 'compare' && comparisonAnalysis ? 
                 Object.keys(comparisonAnalysis) : allKeys;
    
    const groups = {};
    const ungrouped = [];
    
    keys.forEach(key => {
      const numberMatch = key.match(/^(.+?)(_)?(\d+)$/);
      if (numberMatch) {
        const prefix = numberMatch[1];
        if (prefix.length >= 3) {
          if (!groups[prefix]) groups[prefix] = [];
          groups[prefix].push(key);
        } else {
          ungrouped.push(key);
        }
      } else {
        ungrouped.push(key);
      }
    });
    
    Object.keys(groups).forEach(prefix => {
      const fields = groups[prefix];
      if (fields.length < 2) {
        ungrouped.push(...fields);
        delete groups[prefix];
      } else {
        const numbers = fields.map(f => {
          const match = f.match(/(\d+)$/);
          return match ? parseInt(match[1]) : null;
        }).filter(n => n !== null).sort((a, b) => a - b);
        
        if (numbers.length < 2) {
          ungrouped.push(...fields);
          delete groups[prefix];
        }
      }
    });
    
    return { groups, ungrouped };
  }, [mode, allKeys, comparisonAnalysis]);

  const filteredKeys = useMemo(() => {
    let keys = mode === 'compare' && comparisonAnalysis ? 
               Object.keys(comparisonAnalysis) : allKeys;
    
    if (searchTerm) {
      keys = keys.filter(key => 
        key.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (hideEmpty) {
      if (mode === 'compare') {
        keys = keys.filter(key => {
          const analysis = comparisonAnalysis[key];
          return analysis.countA > 0 || analysis.countB > 0;
        });
      } else {
        keys = keys.filter(key => fieldStats[key]?.count > 0);
      }
    }
    
    // Filter by export mode in compare mode
    if (mode === 'compare' && exportMode !== 'all') {
      keys = keys.filter(key => {
        const analysis = comparisonAnalysis[key];
        if (exportMode === 'common') {
          return analysis.status === 'both';
        } else if (exportMode === 'differences') {
          return analysis.status !== 'both';
        }
        return true;
      });
    }
    
    return keys;
  }, [mode, allKeys, searchTerm, hideEmpty, fieldStats, comparisonAnalysis, exportMode]);

  const toggleKey = (key) => {
    const newSelected = new Set(selectedKeys);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedKeys(newSelected);
  };

  const toggleGroup = (groupName) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupName)) {
      newCollapsed.delete(groupName);
    } else {
      newCollapsed.add(groupName);
    }
    setCollapsedGroups(newCollapsed);
  };

  const selectAll = () => {
    setSelectedKeys(new Set(filteredKeys));
  };

  const deselectAll = () => {
    const newSelected = new Set(selectedKeys);
    filteredKeys.forEach(key => newSelected.delete(key));
    setSelectedKeys(newSelected);
  };

  const filteredData = useMemo(() => {
    if (selectedKeys.size === 0) return [];
    
    return jsonData.map(item => {
      const filtered = {};
      Array.from(selectedKeys).sort().forEach(key => {
        if (key in item) {
          filtered[key] = item[key];
        }
      });
      return filtered;
    });
  }, [jsonData, selectedKeys]);

  const filteredDataB = useMemo(() => {
    if (mode !== 'compare' || selectedKeys.size === 0) return [];
    
    return jsonDataB.map(item => {
      const filtered = {};
      Array.from(selectedKeys).sort().forEach(key => {
        if (key in item) {
          filtered[key] = item[key];
        }
      });
      return filtered;
    });
  }, [mode, jsonDataB, selectedKeys]);

  const getTypeColor = (value) => {
    const type = typeof value;
    if (value === null) return '#6F7B87';
    if (type === 'string') return '#7eb3ff';
    if (type === 'number') return '#ffd700';
    if (type === 'boolean') return '#90ee90';
    if (Array.isArray(value)) return '#ff9f7f';
    if (type === 'object') return '#dda0dd';
    return '#D1D2D3';
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) {
      alert('No data to export. Please select some fields first.');
      return;
    }

    try {
      const headers = Array.from(selectedKeys).sort();
      const csvRows = [];
      
      if (mode === 'compare' && jsonDataB.length > 0) {
        // Compare mode export
        csvRows.push(['Dataset', ...headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',')].join(','));
        
        filteredData.forEach((item, idx) => {
          const values = headers.map(header => {
            const value = item[header];
            if (value === null || value === undefined) return '';
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            return `"${stringValue.replace(/"/g, '""')}"`;
          });
          csvRows.push(['A', ...values].join(','));
        });
        
        filteredDataB.forEach((item, idx) => {
          const values = headers.map(header => {
            const value = item[header];
            if (value === null || value === undefined) return '';
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            return `"${stringValue.replace(/"/g, '""')}"`;
          });
          csvRows.push(['B', ...values].join(','));
        });
      } else {
        // Extract mode export
        csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));
        
        filteredData.forEach(item => {
          const values = headers.map(header => {
            const value = item[header];
            if (value === null || value === undefined) return '';
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            return `"${stringValue.replace(/"/g, '""')}"`;
          });
          csvRows.push(values.join(','));
        });
      }
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `filtered-data-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error exporting CSV: ' + err.message);
    }
  };

  const exportToJSON = () => {
    if (filteredData.length === 0) {
      alert('No data to export. Please select some fields first.');
      return;
    }
    
    try {
      let jsonContent;
      
      if (mode === 'compare' && jsonDataB.length > 0) {
        jsonContent = JSON.stringify({
          datasetA: filteredData,
          datasetB: filteredDataB
        }, null, 2);
      } else {
        jsonContent = JSON.stringify(filteredData, null, 2);
      }
      
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `filtered-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error exporting JSON: ' + err.message);
    }
  };

  const renderFieldCheckbox = (key) => {
    if (mode === 'compare') {
      const analysis = comparisonAnalysis[key];
      let statusColor = '#D1D2D3';
      let statusIcon = '✅';
      
      if (analysis.status === 'both') {
        if (analysis.valuesDiffer) {
          // Values differ - red warning
          statusColor = '#ff6b6b';
          statusIcon = '⚠️';
        } else if (analysis.typeMismatch) {
          // Type mismatch - orange
          statusColor = '#ff9f7f';
          statusIcon = '⚠️';
        } else {
          // All good - green
          statusColor = '#90ee90';
          statusIcon = '✅';
        }
      } else if (analysis.status === 'onlyA') {
        statusColor = '#7eb3ff';
        statusIcon = '🔵';
      } else {
        statusColor = '#ff9f7f';
        statusIcon = '🟠';
      }
      
      // Determine tooltip text
      let tooltipText = '';
      if (analysis.status === 'both') {
        if (analysis.valuesDiffer) {
          tooltipText = 'Field exists in both datasets but values differ';
        } else if (analysis.typeMismatch) {
          tooltipText = 'Field exists in both datasets but has mixed types';
        } else {
          tooltipText = 'Field exists in both datasets with matching values';
        }
      } else if (analysis.status === 'onlyA') {
        tooltipText = 'Field only exists in Dataset A';
      } else {
        tooltipText = 'Field only exists in Dataset B';
      }
      
      return (
        <div key={key} className="relative group" title={tooltipText}>
          <button
            onClick={() => toggleKey(key)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all"
            style={{
              backgroundColor: selectedKeys.has(key) ? '#6F7B87' : '#222426',
              border: `1px solid ${selectedKeys.has(key) ? '#6F7B87' : '#3F4245'}`,
              color: '#F7F7FA'
            }}
          >
            {selectedKeys.has(key) ? (
              <CheckSquare className="w-4 h-4 flex-shrink-0" />
            ) : (
              <Square className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="text-sm mr-1" style={{ color: statusColor }}>{statusIcon}</span>
            <span className="truncate text-sm flex-1">{key}</span>
            <div className="flex gap-1 text-xs">
              {analysis.inA && (
                <span 
                  className="px-2 py-0.5 rounded"
                  style={{ backgroundColor: '#313335', color: '#7eb3ff' }}
                  title={`Dataset A: ${analysis.countA} occurrences`}
                >
                  A:{analysis.countA}
                </span>
              )}
              {analysis.inB && (
                <span 
                  className="px-2 py-0.5 rounded"
                  style={{ backgroundColor: '#313335', color: '#ff9f7f' }}
                  title={`Dataset B: ${analysis.countB} occurrences`}
                >
                  B:{analysis.countB}
                </span>
              )}
            </div>
          </button>
        </div>
      );
    } else {
      const stats = fieldStats[key] || { count: 0, types: [] };
      const hasTypeMismatch = stats.types.length > 1;
      
      return (
        <div key={key} className="relative group">
          <button
            onClick={() => toggleKey(key)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all"
            style={{
              backgroundColor: selectedKeys.has(key) ? '#6F7B87' : '#222426',
              border: `1px solid ${selectedKeys.has(key) ? '#6F7B87' : '#3F4245'}`,
              color: '#F7F7FA'
            }}
          >
            {selectedKeys.has(key) ? (
              <CheckSquare className="w-4 h-4 flex-shrink-0" />
            ) : (
              <Square className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="truncate text-sm flex-1">{key}</span>
            <span 
              className="text-xs px-2 py-0.5 rounded"
              style={{ 
                backgroundColor: '#313335',
                color: hasTypeMismatch ? '#ff9f7f' : '#D1D2D3'
              }}
              title={`${stats.count} occurrences across ${jsonData.length} records${hasTypeMismatch ? ' - Mixed types!' : ''}`}
            >
              {stats.count}
            </span>
          </button>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: '#181A1B', fontFamily: "'Courier Prime', 'Courier New', monospace" }}>
      <div className="max-w-7xl mx-auto">
        <div className="rounded-2xl shadow-2xl p-4 md:p-8" style={{ backgroundColor: '#232526', border: '1px solid #3F4245' }}>
          <div className="flex items-center gap-3 mb-6">
            <Upload className="w-6 h-6 md:w-8 md:h-8" style={{ color: '#ECECEC' }} />
            <h1 className="text-xl md:text-3xl font-bold" style={{ color: '#F7F7FA', fontFamily: "'Courier Prime', 'Courier New', monospace" }}>JSON Data Extractor</h1>
            <div className="relative ml-auto">
              <button
                onClick={() => setShowTooltip(!showTooltip)}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: '#313335', color: '#D1D2D3' }}
              >
                <HelpCircle className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              
              {showTooltip && (
                <div 
                  ref={tooltipRef}
                  className="absolute right-0 top-12 w-72 md:w-80 rounded-lg p-4 shadow-xl z-50"
                  style={{ backgroundColor: '#232526', border: '1px solid #3F4245' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-base md:text-lg" style={{ color: '#F7F7FA' }}>How It Works</h3>
                    <button
                      onClick={() => setShowTooltip(false)}
                      className="p-1 rounded transition-colors"
                      style={{ color: '#D1D2D3' }}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-3 text-sm" style={{ color: '#D1D2D3' }}>
                    <div>
                      <p className="font-semibold mb-1" style={{ color: '#F7F7FA' }}>Extract Mode:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Parses JSON or console output format</li>
                        <li>Shows occurrence counts per field</li>
                        <li>Auto-groups numbered fields (e.g., driver1, driver2)</li>
                        <li>Displays table preview with type-colored values</li>
                        <li>Highlights mixed data types</li>
                        <li>Export selected fields as CSV or JSON</li>
                      </ul>
                    </div>
                    
                    <div>
                      <p className="font-semibold mb-1" style={{ color: '#F7F7FA' }}>Compare Mode:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Paste two datasets side-by-side</li>
                        <li>Analyzes field structure differences</li>
                        <li>Detects value differences in matching fields</li>
                        <li>Shows sample values from both datasets</li>
                        <li>Export filters: All, Common only, or Differences only</li>
                        <li>Exports both datasets in single file</li>
                      </ul>
                    </div>
                    
                    <div>
                      <p className="font-semibold mb-1" style={{ color: '#F7F7FA' }}>What it doesn't do:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>No data transformation or calculations</li>
                        <li>No data validation or cleaning</li>
                        <li>No merging of multiple datasets</li>
                        <li>No editing of field names or values</li>
                      </ul>
                    </div>
                    
                    <div className="pt-2 border-t" style={{ borderColor: '#3F4245' }}>
                      <p className="text-xs italic mb-2" style={{ color: '#F7F7FA' }}>Compare Mode Indicators:</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span style={{ color: '#90ee90' }}>✅</span> In both, values match
                          <span style={{ color: '#ff6b6b' }}>⚠️</span> In both, values differ
                        </div>
                        <div className="flex items-center gap-2">
                          <span style={{ color: '#7eb3ff' }}>🔵</span> Only in Dataset A
                          <span style={{ color: '#ff9f7f' }}>🟠</span> Only in Dataset B
                        </div>
                      </div>
                      <p className="text-xs italic mt-2" style={{ color: '#F7F7FA' }}>Type Colors:</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span style={{ color: '#7eb3ff' }}>■</span> String
                          <span style={{ color: '#ffd700' }}>■</span> Number
                          <span style={{ color: '#90ee90' }}>■</span> Boolean
                        </div>
                        <div className="flex items-center gap-2">
                          <span style={{ color: '#ff9f7f' }}>■</span> Array
                          <span style={{ color: '#dda0dd' }}>■</span> Object
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('extract')}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: mode === 'extract' ? '#6F7B87' : '#313335',
                color: '#F7F7FA'
              }}
            >
              Extract Mode
            </button>
            <button
              onClick={() => setMode('compare')}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: mode === 'compare' ? '#6F7B87' : '#313335',
                color: '#F7F7FA'
              }}
            >
              Compare Mode
            </button>
          </div>

          {/* Paste Areas */}
          {mode === 'extract' ? (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: '#D1D2D3' }}>
                Paste Your Data Here
              </label>
              <textarea
                onChange={(e) => handlePaste(e, false)}
                placeholder='Paste your JSON data here...'
                className="w-full h-32 md:h-40 px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: '#313335',
                  border: '1px solid #3F4245',
                  color: '#F7F7FA',
                  fontFamily: "'Courier Prime', 'Courier New', monospace"
                }}
              />
              {error && (
                <p className="mt-2 text-sm" style={{ color: '#ff6b6b' }}>{error}</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#7eb3ff' }}>
                  Dataset A
                </label>
                <textarea
                  onChange={(e) => handlePaste(e, false)}
                  placeholder='Paste Dataset A here...'
                  className="w-full h-32 md:h-40 px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: '#313335',
                    border: '2px solid #7eb3ff',
                    color: '#F7F7FA',
                    fontFamily: "'Courier Prime', 'Courier New', monospace",
                    boxShadow: '0 0 10px rgba(126, 179, 255, 0.2)'
                  }}
                />
                {error && (
                  <p className="mt-2 text-sm" style={{ color: '#ff6b6b' }}>{error}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#ff9f7f' }}>
                  Dataset B
                </label>
                <textarea
                  onChange={(e) => handlePaste(e, true)}
                  placeholder='Paste Dataset B here...'
                  className="w-full h-32 md:h-40 px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: '#313335',
                    border: '2px solid #ff9f7f',
                    color: '#F7F7FA',
                    fontFamily: "'Courier Prime', 'Courier New', monospace",
                    boxShadow: '0 0 10px rgba(255, 159, 127, 0.2)'
                  }}
                />
                {errorB && (
                  <p className="mt-2 text-sm" style={{ color: '#ff6b6b' }}>{errorB}</p>
                )}
              </div>
            </div>
          )}

          {(jsonData.length > 0 || (mode === 'compare' && jsonDataB.length > 0)) && (
            <>
              <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
                <div className="rounded-lg p-3 md:p-4" style={{ backgroundColor: '#313335', border: '1px solid #3F4245' }}>
                  <div className="text-xs md:text-sm" style={{ color: '#D1D2D3' }}>
                    {mode === 'compare' ? 'Records A/B' : 'Records'}
                  </div>
                  <div className="text-lg md:text-2xl font-bold" style={{ color: '#F7F7FA' }}>
                    {mode === 'compare' ? `${jsonData.length}/${jsonDataB.length}` : jsonData.length}
                  </div>
                </div>
                <div className="rounded-lg p-3 md:p-4" style={{ backgroundColor: '#313335', border: '1px solid #3F4245' }}>
                  <div className="text-xs md:text-sm" style={{ color: '#D1D2D3' }}>Total Fields</div>
                  <div className="text-lg md:text-2xl font-bold" style={{ color: '#F7F7FA' }}>
                    {mode === 'compare' && comparisonAnalysis ? Object.keys(comparisonAnalysis).length : allKeys.length}
                  </div>
                </div>
                <div className="rounded-lg p-3 md:p-4" style={{ backgroundColor: '#313335', border: '1px solid #3F4245' }}>
                  <div className="text-xs md:text-sm" style={{ color: '#D1D2D3' }}>Selected</div>
                  <div className="text-lg md:text-2xl font-bold" style={{ color: '#F7F7FA' }}>{selectedKeys.size}</div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#6F7B87' }} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search fields..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: '#313335',
                      border: '1px solid #3F4245',
                      color: '#F7F7FA'
                    }}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: '#6F7B87' }}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setHideEmpty(!hideEmpty)}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: hideEmpty ? '#6F7B87' : '#313335',
                    color: '#F7F7FA'
                  }}
                >
                  <Filter className="w-5 h-5" />
                  <span className="hidden md:inline">{hideEmpty ? 'Show All' : 'Hide Empty'}</span>
                </button>
              </div>

              {mode === 'compare' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#D1D2D3' }}>
                    Export Filter:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setExportMode('all')}
                      className="px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                      style={{
                        backgroundColor: exportMode === 'all' ? '#6F7B87' : '#313335',
                        color: '#F7F7FA'
                      }}
                    >
                      All Fields
                    </button>
                    <button
                      onClick={() => setExportMode('common')}
                      className="px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                      style={{
                        backgroundColor: exportMode === 'common' ? '#6F7B87' : '#313335',
                        color: '#F7F7FA'
                      }}
                    >
                      Common Only
                    </button>
                    <button
                      onClick={() => setExportMode('differences')}
                      className="px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                      style={{
                        backgroundColor: exportMode === 'differences' ? '#6F7B87' : '#313335',
                        color: '#F7F7FA'
                      }}
                    >
                      Differences Only
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 md:gap-3 mb-4">
                <button
                  onClick={selectAll}
                  className="px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base"
                  style={{ backgroundColor: '#6F7B87', color: '#F7F7FA' }}
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className="px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base"
                  style={{ backgroundColor: '#313335', color: '#F7F7FA' }}
                >
                  Deselect All
                </button>
              </div>

              <div className="rounded-lg p-4 mb-6 max-h-96 overflow-y-auto" style={{ backgroundColor: '#313335', border: '1px solid #3F4245' }}>
                <div className="space-y-4">
                  {Object.entries(groupedFields.groups).map(([groupName, fields]) => {
                    const groupFields = fields.filter(f => filteredKeys.includes(f));
                    if (groupFields.length === 0) return null;
                    
                    return (
                      <div key={groupName}>
                        <button
                          onClick={() => toggleGroup(groupName)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-2 transition-colors"
                          style={{ backgroundColor: '#222426', border: '1px solid #3F4245', color: '#F7F7FA' }}
                        >
                          {collapsedGroups.has(groupName) ? (
                            <ChevronRight className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          <span className="font-semibold">{groupName} ({groupFields.length})</span>
                        </button>
                        {!collapsedGroups.has(groupName) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-6">
                            {groupFields.map(renderFieldCheckbox)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {groupedFields.ungrouped.filter(f => filteredKeys.includes(f)).length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {groupedFields.ungrouped.filter(f => filteredKeys.includes(f)).map(renderFieldCheckbox)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 md:gap-3 mb-6">
                <button
                  onClick={exportToCSV}
                  disabled={selectedKeys.size === 0}
                  className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                  style={{ backgroundColor: '#6F7B87', color: '#F7F7FA' }}
                >
                  <Download className="w-4 h-4 md:w-5 md:h-5" />
                  Export CSV
                </button>
                <button
                  onClick={exportToJSON}
                  disabled={selectedKeys.size === 0}
                  className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                  style={{ backgroundColor: '#6F7B87', color: '#F7F7FA' }}
                >
                  <Download className="w-4 h-4 md:w-5 md:h-5" />
                  Export JSON
                </button>
              </div>

              {selectedKeys.size > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base md:text-lg font-semibold" style={{ color: '#F7F7FA' }}>
                      {mode === 'compare' ? 'Comparison Preview' : `Table Preview (first ${previewCount} records)`}
                    </h3>
                    <div className="flex items-center gap-2">
                      <select
                        value={previewCount}
                        onChange={(e) => setPreviewCount(Number(e.target.value))}
                        className="px-2 py-1 rounded text-sm"
                        style={{ backgroundColor: '#313335', color: '#F7F7FA', border: '1px solid #3F4245' }}
                      >
                        <option value={3}>3</option>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                      </select>
                      <button
                        onClick={() => setPreviewCount(previewCount)}
                        className="p-2 rounded transition-colors"
                        style={{ backgroundColor: '#313335', color: '#D1D2D3' }}
                        title="Refresh preview"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {mode === 'compare' ? (
                    <div className="rounded-lg overflow-x-auto" style={{ backgroundColor: '#313335', border: '1px solid #3F4245' }}>
                      <table className="w-full text-xs md:text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold sticky left-0 z-10" style={{ backgroundColor: '#222426', color: '#F7F7FA', borderBottom: '2px solid #3F4245', borderRight: '2px solid #181A1B' }}>
                              Field
                            </th>
                            <th className="px-3 py-2 text-left font-semibold" style={{ color: '#7eb3ff', backgroundColor: '#222426', borderBottom: '2px solid #3F4245', borderRight: '2px solid #181A1B' }}>
                              Sample Values (A)
                            </th>
                            <th className="px-3 py-2 text-left font-semibold" style={{ color: '#ff9f7f', backgroundColor: '#222426', borderBottom: '2px solid #3F4245' }}>
                              Sample Values (B)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from(selectedKeys).sort().map((key, idx) => {
                            const analysis = comparisonAnalysis[key];
                            const samplesA = analysis.samplesA.map(v => 
                              typeof v === 'object' ? JSON.stringify(v) : String(v)
                            ).join(', ');
                            const samplesB = analysis.samplesB.map(v => 
                              typeof v === 'object' ? JSON.stringify(v) : String(v)
                            ).join(', ');
                            
                            return (
                              <tr key={key}>
                                <td 
                                  className="px-3 py-2 font-semibold sticky left-0 z-10 whitespace-nowrap" 
                                  style={{ 
                                    backgroundColor: '#222426', 
                                    color: '#F7F7FA', 
                                    borderBottom: '1px solid #3F4245',
                                    borderRight: '2px solid #181A1B'
                                  }}
                                >
                                  {key}
                                </td>
                                <td 
                                  className="px-3 py-2" 
                                  style={{ 
                                    color: analysis.inA ? '#D1D2D3' : '#6F7B87',
                                    backgroundColor: 'rgba(126, 179, 255, 0.1)',
                                    borderBottom: '1px solid #3F4245',
                                    borderRight: '2px solid #181A1B'
                                  }}
                                >
                                  {analysis.inA ? (samplesA.length > 50 ? samplesA.substring(0, 50) + '...' : samplesA || 'null') : '(not in A)'}
                                </td>
                                <td 
                                  className="px-3 py-2" 
                                  style={{ 
                                    color: analysis.inB ? '#D1D2D3' : '#6F7B87',
                                    backgroundColor: 'rgba(255, 159, 127, 0.1)',
                                    borderBottom: '1px solid #3F4245'
                                  }}
                                >
                                  {analysis.inB ? (samplesB.length > 50 ? samplesB.substring(0, 50) + '...' : samplesB || 'null') : '(not in B)'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-lg overflow-x-auto" style={{ backgroundColor: '#313335', border: '1px solid #3F4245' }}>
                      <table className="w-full text-xs md:text-sm">
                        <thead>
                          <tr style={{ borderBottom: '1px solid #3F4245' }}>
                            <th className="px-3 py-2 text-left font-semibold sticky left-0 z-10" style={{ backgroundColor: '#222426', color: '#F7F7FA' }}>
                              Record
                            </th>
                            {Array.from(selectedKeys).sort().map(key => (
                              <th key={key} className="px-3 py-2 text-left font-semibold whitespace-nowrap" style={{ color: '#F7F7FA' }}>
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData.slice(0, previewCount).map((record, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #3F4245' }}>
                              <td className="px-3 py-2 font-semibold sticky left-0 z-10" style={{ backgroundColor: '#222426', color: '#D1D2D3' }}>
                                #{idx + 1}
                              </td>
                              {Array.from(selectedKeys).sort().map(key => {
                                const value = record[key];
                                const displayValue = value === null || value === undefined ? 
                                  'null' : 
                                  typeof value === 'object' ? 
                                    JSON.stringify(value) : 
                                    String(value);
                                
                                return (
                                  <td 
                                    key={key} 
                                    className="px-3 py-2 whitespace-nowrap"
                                    style={{ color: getTypeColor(value) }}
                                    title={`Type: ${typeof value}`}
                                  >
                                    {displayValue.length > 50 ? displayValue.substring(0, 50) + '...' : displayValue}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {jsonData.length === 0 && !error && (
            <div className="text-center py-8 md:py-12">
              <Upload className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-50" style={{ color: '#6F7B87' }} />
              <p className="text-base md:text-lg" style={{ color: '#D1D2D3' }}>
                {mode === 'compare' ? 'Paste datasets above to compare' : 'Paste your data above to get started'}
              </p>
              <p className="text-xs md:text-sm mt-2" style={{ color: '#6F7B87' }}>Just copy and paste - the tool handles the rest!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}