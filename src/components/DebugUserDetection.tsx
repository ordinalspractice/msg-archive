import React from 'react';
import { Box, Text, VStack, Badge } from '@chakra-ui/react';
import { useAppContext } from '../context/AppContext';

interface DebugUserDetectionProps {
  messages?: Array<{ sender_name: string; content?: string }>;
}

export const DebugUserDetection: React.FC<DebugUserDetectionProps> = ({ messages = [] }) => {
  const { currentUserName } = useAppContext();
  
  // Get unique senders from messages
  const senders = [...new Set(messages.map(m => m.sender_name))];
  
  return (
    <Box bg="orange.50" p={3} borderRadius="md" border="1px solid orange.200">
      <VStack align="start" spacing={2}>
        <Text fontSize="sm" fontWeight="bold" color="orange.800">
          🔍 Debug: User Detection
        </Text>
        
        <Text fontSize="xs" color="gray.600">
          <strong>Detected User:</strong> {currentUserName ? `"${currentUserName}"` : 'None detected'}
        </Text>
        
        {currentUserName && (
          <Text fontSize="xs" color="blue.600">
            <strong>Detection Status:</strong> ✅ Ready (check console for autofill details)
          </Text>
        )}
        
        {!currentUserName && (
          <Text fontSize="xs" color="orange.600">
            <strong>Detection Status:</strong> ❌ Failed (check console for autofill errors)
          </Text>
        )}
        
        <Text fontSize="xs" color="gray.600">
          <strong>Senders in this conversation:</strong>
        </Text>
        
        {senders.map((sender, i) => (
          <Badge 
            key={i} 
            colorScheme={sender === currentUserName ? "blue" : "gray"}
            variant={sender === currentUserName ? "solid" : "outline"}
            fontSize="xs"
          >
            {sender} {sender === currentUserName && "← YOU"}
          </Badge>
        ))}
        
        {messages.length > 0 && (
          <Text fontSize="xs" color="gray.500">
            Sample messages: {messages.slice(0, 3).map(m => 
              `${m.sender_name}: ${(m.content || '').substring(0, 20)}...`
            ).join(' | ')}
          </Text>
        )}
      </VStack>
    </Box>
  );
};