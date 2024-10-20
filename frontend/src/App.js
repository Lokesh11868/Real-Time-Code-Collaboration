import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Editor } from '@monaco-editor/react';
import './style.css'; // Import the external CSS file

const socket = io('http://localhost:4000');

const generateRoomId = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let roomId = '';
  const length = Math.floor(Math.random() * (10 - 6 + 1)) + 6; // Random length between 6-10
  for (let i = 0; i < length; i++) {
    roomId += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return roomId;
};

const App = () => {
  const [code, setCode] = useState('// Start coding here...');
  const [language, setLanguage] = useState('javascript');
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLanguageChange = (event) => {
    const selectedLanguage = event.target.value;
    setLanguage(selectedLanguage);
    setCode(sampleCodes[selectedLanguage]);
  };

  const sampleCodes = {
    javascript: `// Sample JavaScript Code
    function greet(name) {
      console.log('Hello, ' + name + '!');
    }
    greet('World');`,

    python: `# Sample Python Code
    def greet(name):
      print('Hello, ' + name + '!')
      greet('World')`,

    java: `// Sample Java Code
    public class Main {
      public static void main(String[] args) {
        System.out.println("Hello, World!");
      }
    }`,

    cpp: `// Sample C++ Code
    #include <iostream>
    using namespace std;

    int main() {
      cout << "Hello, World!" << endl;
    return 0;
    }`,

    c: `// Sample C Code
  #include <stdio.h>

  int main() {
    printf("Hello, World!\n");
    return 0;
    }`,

    typescript: `// Sample TypeScript Code
    function greet(name: string): void {
      console.log('Hello, ' + name + '!');
    }
    greet('World');`,

    html: `<!-- Sample HTML Code -->
    <!DOCTYPE html>
    <html>
      <head>
        <title>Hello World</title>
      </head>
      <body>
        <h1>Hello, World!</h1>
      </body>
    </html>`,

    css: `/* Sample CSS Code */
    body {
      background-color: lightblue;
    }
    h1 {
      color: white;
      text-align: center;
    }`,

    json: `// Sample JSON Code
    {
      "greet": "Hello, World!"
    }`,

    sql: `-- Sample SQL Code
    SELECT 'Hello, World!' AS greeting;`,

    ruby: `# Sample Ruby Code
    def greet(name)
      puts 'Hello, ' + name + '!'
    end
    greet('World')`,

    php: `<?php
    // Sample PHP Code
    function greet($name) {
      echo 'Hello, ' . $name . '!';
    }
    greet('World');
    ?>`,

    go: `// Sample Go Code
    package main

    import "fmt"

    func main() {
      fmt.Println("Hello, World!")
    }`
  };

  useEffect(() => {
    socket.on('user-list', (userList) => {
      setUsers(userList);
    });

    socket.on('message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    socket.on('code-update', (newCode) => {
      setCode(newCode);
    });

    return () => {
      socket.off('user-list');
      socket.off('message');
      socket.off('code-update');
    };
  }, []);

  const handleCreateRoomClick = () => {
    const generatedRoomCode = generateRoomId();
    setRoomCode(generatedRoomCode);
    setIsCreatingRoom(true);
  };

  const handleCreateRoom = () => {
    if (username && roomCode) {
      socket.emit('join-room', { username, roomCode });
      setIsAuthenticated(true);
    } else {
      alert('Please enter a username.');
    }
  };

  const handleJoinRoom = () => {
    if (username && roomCode) {
      socket.emit('join-room', { username, roomCode });
      setIsAuthenticated(true);
    } else {
      alert('Please enter both username and room ID.');
    }
  };

  const handleCodeChange = (newValue) => {
    setCode(newValue);
    socket.emit('code-change', { roomCode, code: newValue });
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const msgObject = { username, message };
      socket.emit('message', msgObject);
      setMessage('');
    }
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomCode);
    alert('Room ID copied to clipboard!');
  };

  const handleLeaveRoom = () => {
    socket.emit('leave-room', { username, roomCode });
    setIsAuthenticated(false);
    setRoomCode('');
    setUsers([]);
  };

  return (
    <div className="app-container">
      {!isAuthenticated && (
        <div className="auth">
          <div className="auth-container">
            <h1>Welcome to Code Collaboration!</h1>
            <h3>Get Started</h3>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="username-input"
            />
            <div className="action-buttons">
              {!isCreatingRoom && !isJoiningRoom && (
                <>
                  <button onClick={handleCreateRoomClick}>Create Room</button>
                  <button onClick={() => setIsJoiningRoom(true)}>Join Room</button>
                </>
              )}
            </div>
            {isCreatingRoom && (
              <div className="roomId-generate">
                <p>Room ID generated: <strong>{roomCode}</strong></p>
                <button onClick={handleCreateRoom}>Confirm</button>
              </div>
            )}
            {isJoiningRoom && (
              <div>
                <input
                  type="text"
                  placeholder="Enter the room ID"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="room-input"
                />
                <button className="Join-room" onClick={handleJoinRoom}>Join Room</button>
              </div>
            )}
          </div>
        </div>
      )}

      {isAuthenticated && (
        <div className="collaboration-container">
          <div className="left-panel">
            <h3>Users joined</h3>
            <ul>
              {users.map((user, index) => (
                <li key={index} style={{ color: 'white' }}>{user}</li>
              ))}
            </ul>
            <div className="room-buttons">
              <button onClick={handleCopyRoomId}>Copy Room ID</button>
              <button onClick={handleLeaveRoom}>Leave Room</button>
            </div>
          </div>

          <div className="code-editor-container">
            <Editor
              height="97vh"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={handleCodeChange}
              options={{
                fontFamily: 'monospace',
                fontSize: 14,
                lineNumbers: 'on',
                minimap: { enabled: true, renderCharacters: true, maxColumn: 150 },
                wordWrap: 'on',
                tabSize: 2,
                smoothScrolling: true,
                autoClosingBrackets: 'always',
                folding: true,
                renderWhitespace: 'all',
                cursorBlinking: 'smooth',
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                  alwaysConsumeMouseWheel: false, // Allow other elements to use mouse wheel when hovered
                },
                scrollBeyondLastLine: false,
                quickSuggestions: { other: true, comments: true, strings: true },
                formatOnPaste: true,
                formatOnType: true,
                automaticLayout: true,
                readOnly: false,
                highlightActiveLine: true,
                cursorStyle: 'line',
                showFoldingControls: 'always',
                codeLens: true,

                // New properties added below
                dragAndDrop: true,
                contextmenu: true,
                lineDecorationsWidth: 20,
                matchBrackets: 'always',
                find: {
                  autoFindInSelection: 'always',
                },
                selectionHighlight: true,
                occurrencesHighlight: true,
                glyphMargin: true,
                lightbulb: {
                  enabled: true,
                },
                links: true,
                inlineHints: {
                  enabled: true,
                },
                suggest: {
                  snippetsPreventQuickSuggestions: false,
                },
                mouseWheelZoom: true,
                multiCursorModifier: 'ctrlCmd',
                accessibilitySupport: 'on',
                suggestOnTriggerCharacters: true,
                showUnused: true,
                foldingHighlight: true,
                tabCompletion: 'on',
                hover: {
                  enabled: true,
                  delay: 300,                       // Delay before hover information appears
                },
                copyWithSyntaxHighlighting: true,
                renderControlCharacters: true,
                mouseWheelScrollSensitivity: 1.5,

                // Additional IDE-like features
                renderLineHighlight: 'all',        // Highlight the entire line where the cursor is
                lineNumbersMinChars: 3,            // Minimum number of characters for line numbers
                autoIndent: 'full',                // Automatically indent pasted code or new lines
                snippetSuggestions: 'inline',      // Show code snippets inline with suggestions
                matchOnWordStartOnly: false,       // Allow matching suggestions anywhere in a word
                parameterHints: {
                  enabled: true,                   // Show parameter hints when typing function arguments
                },
                colorDecorators: true,             // Render inline color decorators (e.g., color previews)
                renderLineHighlightOnlyWhenFocus: false, // Always show line highlight, even when not focused
                autoSurround: 'brackets',          // Automatically wrap selected text with brackets
                stickyTabStops: true,              // Preserve indentation when using arrow keys in empty lines
                showDeprecated: true,              // Display deprecated items with strikethrough
                cursorSmoothCaretAnimation: true,  // Smoothly animate cursor movements
                foldingStrategy: 'indentation',    // Use indentation-based folding    
                revealHorizontalRightPadding: 30,  // Add extra padding when scrolling horizontally
                peekWidgetDefaultFocus: 'tree',    // Focus on the peek widget when using "peek" features
                fastScrollSensitivity: 5,          // Increase the speed of scrolling with the Shift key
                breadcrumb: {
                  enabled: true,                   // Enable breadcrumb navigation at the top
                },
                gotoLocation: {
                  multiple: 'gotoAndPeek',         // Show a peek window when navigating to a definition
                },
                bracketPairColorization: {
                  enabled: true,                   // Colorize matching brackets
                  independentColorPoolPerBracketType: true, // Different colors for each bracket type
                },
                suggestSelection: 'recentlyUsedByPrefix', // Prefer suggestions that match recent entries
                highlightMatches: true,            // Highlight search matches
                inlineSuggest: {
                  enabled: true,                   // Show inline code suggestions
                },
                indentGuides: {
                  enabled: true,                   // Show vertical lines to indicate indentation levels
                },
                wordBasedSuggestions: true,        // Suggest words from the document as completion items
                mouseDrag: {
                  scrollOnDrag: true,              // Enable scrolling when dragging with the mouse
                },
                codeActionsOnSave: {
                  'source.fixAll': true            // Automatically apply fixable errors on save
                },
              }}
            />
          </div>

          <div className="chat-container">
            <div className="Choose-language">
              <p>Choose Language:</p>
              <select className="Dropdown" value={language} onChange={handleLanguageChange}>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="typescript">TypeScript</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
                <option value="sql">SQL</option>
                <option value="ruby">Ruby</option>
                <option value="php">PHP</option>
                <option value="go">Go</option>
              </select>
            </div>
            <h3>Chat</h3>
            <div className="chat-box">
              {messages.map((msg, index) => (
                <p key={index}><strong style={{ color: 'white' }}>{msg.username}:</strong> {msg.message}</p>
              ))}
            </div>
            <div className="msg">
              <input
                type="text"
                value={message}
                placeholder="Type a message..."
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="message-input"
              />
              <button onClick={handleSendMessage}>send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
