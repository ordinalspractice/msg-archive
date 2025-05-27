import React, { useMemo } from 'react';
import { Box, Text, VStack, HStack } from '@chakra-ui/react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { logger } from '../utils/logger';
import type { Message } from '../types/messenger';

interface TimelineHeatmapProps {
  messages: Message[];
}

interface DayData {
  date: string;
  count: number;
}

export const TimelineHeatmap: React.FC<TimelineHeatmapProps> = ({ messages }) => {
  const heatmapData = useMemo(() => {
    logger.debug('TIMELINE_RENDERED', { messageCount: messages.length });

    // Group messages by date
    const dateMap = new Map<string, number>();

    messages.forEach((message) => {
      const date = new Date(message.timestamp_ms);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
    });

    // Convert to array format expected by calendar heatmap
    const data: DayData[] = Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    return data;
  }, [messages]);

  const startDate = useMemo(() => {
    if (messages.length === 0) return new Date();
    const firstMessage = messages[0];
    return new Date(firstMessage.timestamp_ms);
  }, [messages]);

  const endDate = useMemo(() => {
    if (messages.length === 0) return new Date();
    const lastMessage = messages[messages.length - 1];
    return new Date(lastMessage.timestamp_ms);
  }, [messages]);

  const handleCellClick = (value: DayData | null) => {
    if (!value || value.count === 0) return;

    // Find first message on this date
    const targetDate = new Date(value.date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const messageIndex = messages.findIndex((msg) => {
      const msgDate = new Date(msg.timestamp_ms);
      return msgDate >= startOfDay && msgDate <= endOfDay;
    });

    if (messageIndex >= 0) {
      // This would trigger a scroll in the message list
      // For now, we'll just log it
      logger.debug('TIMELINE_CELL_CLICKED', { date: value.date, messageIndex });
    }
  };

  return (
    <Box bg="white" p={4} borderRadius="lg" shadow="sm">
      <VStack align="stretch" spacing={4}>
        <Text fontWeight="semibold" fontSize="lg">
          Message Activity Timeline
        </Text>

        <Box overflowX="auto">
          <Box minW="800px">
            <CalendarHeatmap
              startDate={startDate}
              endDate={endDate}
              values={heatmapData}
              classForValue={(value: DayData | null) => {
                if (!value || value.count === 0) {
                  return 'color-empty';
                }
                if (value.count < 5) return 'color-scale-1';
                if (value.count < 10) return 'color-scale-2';
                if (value.count < 20) return 'color-scale-3';
                return 'color-scale-4';
              }}
              tooltipDataAttrs={(value: DayData | null) => {
                if (!value || value.count === 0) {
                  return { 'data-tip': 'No messages' };
                }
                return {
                  'data-tip': `${value.count} message${value.count === 1 ? '' : 's'} on ${new Date(value.date).toLocaleDateString()}`,
                };
              }}
              onClick={handleCellClick}
            />
          </Box>
        </Box>

        <HStack justify="center" spacing={4} fontSize="sm" color="gray.600">
          <HStack spacing={1}>
            <Box w={3} h={3} bg="gray.200" />
            <Text>No messages</Text>
          </HStack>
          <HStack spacing={1}>
            <Box w={3} h={3} bg="blue.200" />
            <Text>1-5 messages</Text>
          </HStack>
          <HStack spacing={1}>
            <Box w={3} h={3} bg="blue.400" />
            <Text>5-10 messages</Text>
          </HStack>
          <HStack spacing={1}>
            <Box w={3} h={3} bg="blue.600" />
            <Text>10-20 messages</Text>
          </HStack>
          <HStack spacing={1}>
            <Box w={3} h={3} bg="blue.800" />
            <Text>20+ messages</Text>
          </HStack>
        </HStack>
      </VStack>
    </Box>
  );
};
