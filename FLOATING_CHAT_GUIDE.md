# Floating Chat System

## Overview

The floating chat system allows users to open multiple chat windows that float on top of the application interface. These windows can be moved, minimized, and closed independently.

## Features

### Multiple Chat Windows

- Open up to 5 floating chat windows simultaneously
- Each window is independent and can be positioned anywhere on screen
- Automatic positioning for new windows to avoid overlap

### Window Management

- **Drag & Drop**: Click and drag the header to move windows
- **Minimize/Maximize**: Click the minimize button to collapse/expand windows
- **Close**: Click the X button to close individual windows
- **Bring to Front**: Click anywhere on a window to bring it to the front

### Unread Message Indicators

- Red badge shows unread message count on minimized windows
- Unread count resets when window is expanded or input is focused
- Real-time updates via WebSocket connection

### Responsive Design

- Windows automatically adjust position when browser is resized
- Mobile-friendly interface with touch support
- Optimized for different screen sizes

## How to Use

### Opening Floating Chats

1. **From Recent Chats Panel**:

   - Click the "Recent Chats" button in the sidebar
   - Click the floating window icon (external link) next to any chat

2. **From Lead Detail Page**:

   - Open any lead detail page
   - Click the "Float Chat" button next to "Open Chat"

3. **From Kanban Board**:
   - Hover over any lead card
   - Click the floating window icon in the card actions

### Managing Multiple Windows

1. **Sidebar Controls**:

   - When floating chats are open, a control panel appears in the sidebar
   - Shows count of open windows
   - "Minimize All" button to minimize all windows at once
   - "Close All" button to close all windows at once

2. **Individual Window Controls**:
   - Each window can be managed independently
   - Click on window items in the sidebar to bring them to front and expand

### Window Behavior

- **Maximum Windows**: System allows up to 5 windows. Opening a 6th will close the oldest
- **Auto-positioning**: New windows appear in bottom-right, offset from existing windows
- **Persistence**: Windows remain open when navigating between pages
- **Real-time Sync**: Messages sync in real-time across all interfaces

## Technical Implementation

### Services

- `FloatingChatService`: Manages window state and positioning
- `WebSocketService`: Handles real-time message updates
- `RecentChatsService`: Tracks chat history and unread counts

### Components

- `FloatingChatContainerComponent`: Container for all floating windows
- `FloatingChatWindowComponent`: Individual chat window implementation
- Integration in `LayoutComponent` for sidebar controls

### Key Features

- Drag and drop functionality using native mouse events
- Z-index management for window layering
- Viewport boundary detection and adjustment
- Memory efficient with automatic cleanup

## Browser Compatibility

- Modern browsers with ES6+ support
- Touch events for mobile devices
- CSS Grid and Flexbox support required
- WebSocket support for real-time features
