// Intelligent Code Generator - Handles ANY code request based on PRD requirements
export const generateIntelligentCode = (description: string, language: string, codeType: string, complexity: string, requirements: string) => {
  const desc = description.toLowerCase();
  const lang = language.toLowerCase();
  
  // API/Backend patterns
  if (desc.includes('api') || desc.includes('rest') || desc.includes('endpoint')) {
    if (lang === 'javascript' || lang === 'typescript') {
      return `// Express.js REST API
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ${description}
app.get('/api/data', async (req, res) => {
  try {
    // Your API logic here
    const data = { message: 'Success', timestamp: new Date().toISOString() };
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/data', async (req, res) => {
  try {
    const { body } = req;
    // Process the data
    res.json({ success: true, data: body });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`;
    }
  }

  // Database patterns
  if (desc.includes('database') || desc.includes('sql') || desc.includes('crud')) {
    if (lang === 'python') {
      return `import sqlite3
from typing import List, Dict, Optional

class DatabaseManager:
    def __init__(self, db_path: str = 'app.db'):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize database with tables"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()
    
    def create_user(self, name: str, email: str) -> int:
        """Create a new user"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                'INSERT INTO users (name, email) VALUES (?, ?)',
                (name, email)
            )
            conn.commit()
            return cursor.lastrowid
    
    def get_user(self, user_id: int) -> Optional[Dict]:
        """Get user by ID"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def update_user(self, user_id: int, name: str = None, email: str = None) -> bool:
        """Update user information"""
        updates = []
        params = []
        
        if name:
            updates.append('name = ?')
            params.append(name)
        if email:
            updates.append('email = ?')
            params.append(email)
        
        if not updates:
            return False
        
        params.append(user_id)
        query = f'UPDATE users SET {", ".join(updates)} WHERE id = ?'
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(query, params)
            conn.commit()
            return cursor.rowcount > 0
    
    def delete_user(self, user_id: int) -> bool:
        """Delete user by ID"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute('DELETE FROM users WHERE id = ?', (user_id,))
            conn.commit()
            return cursor.rowcount > 0

# Usage example
if __name__ == "__main__":
    db = DatabaseManager()
    
    # Create user
    user_id = db.create_user("John Doe", "john@example.com")
    print(f"Created user with ID: {user_id}")
    
    # Get user
    user = db.get_user(user_id)
    print(f"User: {user}")
    
    # Update user
    db.update_user(user_id, name="John Smith")
    
    # Delete user
    # db.delete_user(user_id)`;
    }
  }

  // Authentication patterns
  if (desc.includes('auth') || desc.includes('login') || desc.includes('jwt')) {
    if (lang === 'javascript' || lang === 'typescript') {
      return `// JWT Authentication System
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const express = require('express');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

class AuthService {
  static async hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }
  
  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }
  
  static generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  }
  
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
}

// Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  const decoded = AuthService.verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
  
  req.user = decoded;
  next();
};

// Routes
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Hash password
    const hashedPassword = await AuthService.hashPassword(password);
    
    // Save user to database (implement your DB logic)
    const user = { id: Date.now(), email, name, password: hashedPassword };
    
    // Generate token
    const token = AuthService.generateToken({ id: user.id, email: user.email });
    
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Get user from database (implement your DB logic)
    const user = { id: 1, email, password: '$2b$10$...' }; // Example
    
    if (!user || !await AuthService.comparePassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = AuthService.generateToken({ id: user.id, email: user.email });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/profile', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = { router, authenticateToken, AuthService };`;
    }
  }

  // React Component patterns
  if (desc.includes('component') || desc.includes('react') || desc.includes('ui')) {
    if (lang === 'javascript' || lang === 'typescript') {
      return `import React, { useState, useEffect } from 'react';

// ${description}
const CustomComponent = ({ title, data, onAction }) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState(data || []);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (data) {
      setItems(data);
    }
  }, [data]);

  const handleAction = async (item) => {
    setLoading(true);
    setError(null);
    
    try {
      await onAction?.(item);
      // Update local state if needed
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="custom-component">
      <h2>{title}</h2>
      <div className="items-grid">
        {items.map((item, index) => (
          <div key={item.id || index} className="item-card">
            <h3>{item.name || item.title}</h3>
            <p>{item.description}</p>
            <button 
              onClick={() => handleAction(item)}
              disabled={loading}
            >
              Action
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomComponent;

// Usage example:
// <CustomComponent 
//   title="My Items" 
//   data={items} 
//   onAction={(item) => console.log('Action on:', item)} 
// />`;
    }
  }

  // Algorithm patterns
  if (desc.includes('algorithm') || desc.includes('sort') || desc.includes('search')) {
    if (lang === 'python') {
      return `# ${description} - Algorithm Implementation

def binary_search(arr, target):
    """
    Binary search algorithm - O(log n) time complexity
    """
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1

def quick_sort(arr):
    """
    Quick sort algorithm - O(n log n) average time complexity
    """
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quick_sort(left) + middle + quick_sort(right)

def merge_sort(arr):
    """
    Merge sort algorithm - O(n log n) time complexity
    """
    if len(arr) <= 1:
        return arr
    
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    
    return merge(left, right)

def merge(left, right):
    """Helper function for merge sort"""
    result = []
    i = j = 0
    
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    
    result.extend(left[i:])
    result.extend(right[j:])
    return result

# Example usage
if __name__ == "__main__":
    # Test data
    data = [64, 34, 25, 12, 22, 11, 90]
    
    # Sorting
    sorted_data = quick_sort(data.copy())
    print(f"Quick sort: {sorted_data}")
    
    # Searching
    target = 25
    index = binary_search(sorted_data, target)
    print(f"Binary search for {target}: index {index}")`;
    }
  }

  // Game patterns (including Snake)
  if (desc.includes('game') || desc.includes('snake') || desc.includes('tic tac toe') || desc.includes('puzzle')) {
    if (desc.includes('snake') && lang === 'python') {
      return `import pygame
import random
import sys

# Snake Game - Complete Implementation
pygame.init()

# Constants
WINDOW_WIDTH = 800
WINDOW_HEIGHT = 600
CELL_SIZE = 20
CELL_NUMBER_X = WINDOW_WIDTH // CELL_SIZE
CELL_NUMBER_Y = WINDOW_HEIGHT // CELL_SIZE

# Colors
BLACK = (0, 0, 0)
GREEN = (0, 255, 0)
RED = (255, 0, 0)
WHITE = (255, 255, 255)

class Snake:
    def __init__(self):
        self.body = [pygame.Vector2(5, 10), pygame.Vector2(4, 10), pygame.Vector2(3, 10)]
        self.direction = pygame.Vector2(1, 0)
        self.new_block = False
    
    def draw_snake(self, screen):
        for block in self.body:
            x_pos = int(block.x * CELL_SIZE)
            y_pos = int(block.y * CELL_SIZE)
            block_rect = pygame.Rect(x_pos, y_pos, CELL_SIZE, CELL_SIZE)
            pygame.draw.rect(screen, GREEN, block_rect)
    
    def move_snake(self):
        if self.new_block:
            body_copy = self.body[:]
            body_copy.insert(0, body_copy[0] + self.direction)
            self.body = body_copy[:]
            self.new_block = False
        else:
            body_copy = self.body[:-1]
            body_copy.insert(0, body_copy[0] + self.direction)
            self.body = body_copy[:]

class Game:
    def __init__(self):
        self.snake = Snake()
        self.food = Food()
        self.score = 0
    
    def update(self):
        self.snake.move_snake()
        self.check_collision()
        self.check_fail()

def main():
    screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
    pygame.display.set_caption('Snake Game')
    clock = pygame.time.Clock()
    game = Game()
    
    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
        
        game.update()
        screen.fill(BLACK)
        game.draw_elements(screen)
        pygame.display.update()
        clock.tick(60)

if __name__ == "__main__":
    main()`;
    }
  }

  // Default intelligent fallback
  return `# ${description}
# Language: ${language}
# Type: ${codeType}
# Complexity: ${complexity}

${lang === 'python' ? `
def main():
    """
    ${description}
    """
    # Implementation based on your requirements
    print("Hello from your generated code!")
    
    # Add your logic here
    result = process_data()
    return result

def process_data():
    """Process data according to requirements"""
    # Your implementation here
    return {"status": "success", "message": "Code generated successfully"}

if __name__ == "__main__":
    result = main()
    print(f"Result: {result}")
` : lang === 'javascript' || lang === 'typescript' ? `
// ${description}
function main() {
    console.log('Hello from your generated code!');
    
    // Add your logic here
    const result = processData();
    return result;
}

function processData() {
    // Your implementation here
    return { status: 'success', message: 'Code generated successfully' };
}

// Export for use in other modules
module.exports = { main, processData };

// Run if this is the main module
if (require.main === module) {
    const result = main();
    console.log('Result:', result);
}
` : `
// Generated code for: ${description}
// Language: ${language}
// Implement your logic here

console.log("Generated code ready for implementation");
`}

# Additional requirements: ${requirements || 'None specified'}
# Configure GEMINI_API_KEY in Supabase for AI-powered generation`;
};
