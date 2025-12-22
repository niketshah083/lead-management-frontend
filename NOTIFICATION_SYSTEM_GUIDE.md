# Notification System Guide

## Overview

The notification system provides real-time alerts when leads initiate new chats or send messages, ensuring you never miss important communications.

## Features

### 🔔 Real-time Notifications

- **Toast notifications** appear instantly when new messages arrive
- **Browser notifications** when the tab is not active (requires permission)
- **Sound alerts** with customizable on/off toggle
- **Visual indicators** with unread count badges

### 📱 Notification Types

1. **New Chat Started** - When a lead initiates their first conversation
2. **New Message** - When existing leads send new messages

### 🎯 Smart Notification Management

- **Auto-read marking** when you open chats or focus on input fields
- **Lead-specific grouping** to avoid spam from same contact
- **Persistent storage** - notifications survive page refreshes
- **Bulk actions** - mark all as read or clear all at once

## How to Use

### Accessing Notifications

1. **Notification Button**: Click the bell icon in the sidebar

   - Shows unread count badge when there are new notifications
   - Orange color indicates notification activity

2. **Notification Panel**: Opens on the left side showing:
   - Recent notifications (up to 20 visible)
   - Lead name, phone number, and message preview
   - Timestamp showing when message was received
   - Action buttons for each notification

### Notification Actions

1. **Click Notification**: Opens the full chat page for that lead
2. **Float Chat Button**: Opens the chat in a floating window
3. **Dismiss Button**: Removes the notification without opening chat
4. **Mark All Read**: Clears all unread indicators
5. **Clear All**: Removes all notifications

### Settings & Controls

1. **Sound Toggle**: Enable/disable notification sounds
2. **Browser Notifications**: Automatic permission request on first load
3. **Auto-read**: Notifications automatically mark as read when you:
   - Open the chat page
   - Focus on chat input field
   - Expand floating chat windows

## Visual Indicators

### Notification States

- **Unread**: Green background with bold text
- **New Chat**: Blue left border (first message from lead)
- **Regular Message**: Green left border (ongoing conversation)

### Badge Colors

- **Red badge**: Unread chat messages (Recent Chats)
- **Orange badge**: Unread notifications (Notifications)

### Sound Notifications

- **Enabled**: Green volume icon in notification panel
- **Disabled**: Gray volume icon
- **Sound**: Two-tone beep (800Hz → 600Hz)

## Integration Points

### Automatic Triggers

1. **WebSocket Messages**: Real-time message reception
2. **Lead Detection**: Automatic lead information fetching
3. **Chat History**: Smart detection of new vs existing conversations

### Manual Actions

1. **Floating Chat**: Open notifications in floating windows
2. **Navigation**: Direct links to full chat pages
3. **Bulk Management**: Control all notifications at once

## Browser Compatibility

### Required Features

- **WebSocket support** for real-time updates
- **Notification API** for browser notifications
- **Web Audio API** for sound alerts
- **Local Storage** for persistence

### Permissions

- **Notification Permission**: Requested automatically
- **Audio Context**: Created on user interaction
- **Background Sync**: Works when tab is active

## Best Practices

### For Users

1. **Enable browser notifications** for important alerts when away
2. **Keep sound on** during business hours
3. **Use floating chats** for multitasking
4. **Regularly clear old notifications** to keep list manageable

### For Administrators

1. **Monitor notification volume** to avoid overwhelming users
2. **Train staff** on notification management features
3. **Set expectations** for response times based on notification system
4. **Consider notification schedules** for different time zones

## Troubleshooting

### Common Issues

1. **No sound**: Check browser audio permissions and notification settings
2. **No browser notifications**: Ensure permission is granted in browser settings
3. **Notifications not appearing**: Check WebSocket connection status
4. **Performance issues**: Clear old notifications regularly

### Browser Settings

- **Chrome**: Settings → Privacy and Security → Site Settings → Notifications
- **Firefox**: Preferences → Privacy & Security → Permissions → Notifications
- **Safari**: Preferences → Websites → Notifications

## Technical Details

### Storage

- **Local Storage**: Notifications persist across sessions
- **Maximum**: 50 notifications stored (oldest auto-removed)
- **Data**: Lead info, message content, timestamps, read status

### Performance

- **Efficient updates**: Only processes inbound messages
- **Smart grouping**: Prevents notification spam
- **Memory management**: Automatic cleanup of old notifications
- **Lazy loading**: Notifications load on demand

### Security

- **No sensitive data**: Only basic message previews stored
- **Local only**: All notification data stays in browser
- **Auto-cleanup**: Old notifications automatically removed
