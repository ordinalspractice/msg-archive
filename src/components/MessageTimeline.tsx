import React, { useMemo, useCallback } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
} from 'recharts';
import type { Message } from '../types/messenger';

interface MessageTimelineProps {
  messages: Message[];
  onTimeRangeSelect: (startDate: Date, endDate: Date) => void;
  currentVisibleDate: Date | null;
}

interface TimelineData {
  monthYear: string;
  messageCount: number;
  timestamp: number;
  year: number;
  month: number;
}

export const MessageTimeline: React.FC<MessageTimelineProps> = ({
  messages,
  onTimeRangeSelect,
  currentVisibleDate,
}) => {
  // Aggregate messages by month
  const timelineData = useMemo(() => {
    if (messages.length === 0) return [];

    const monthMap = new Map<string, number>();

    messages.forEach((message) => {
      const date = new Date(message.timestamp_ms);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;

      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
    });

    // Convert to array and sort by date
    const data: TimelineData[] = Array.from(monthMap.entries())
      .map(([monthKey, count]) => {
        const [year, monthStr] = monthKey.split('-');
        const yearNum = parseInt(year);
        const monthNum = parseInt(monthStr);
        const date = new Date(yearNum, monthNum, 1);

        return {
          monthYear: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          messageCount: count,
          timestamp: date.getTime(),
          year: yearNum,
          month: monthNum,
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    return data;
  }, [messages]);

  // Get current position for reference line
  const currentPosition = useMemo(() => {
    if (!currentVisibleDate || timelineData.length === 0) return null;

    const currentMonth = currentVisibleDate.getMonth();
    const currentYear = currentVisibleDate.getFullYear();

    const found = timelineData.find(
      (item) => item.year === currentYear && item.month === currentMonth,
    );

    return found ? found.monthYear : null;
  }, [currentVisibleDate, timelineData]);

  // Handle area chart clicks
  const handleChartClick = useCallback(
    (data: any) => {
      if (data && data.activePayload && data.activePayload[0]) {
        const clickedData = data.activePayload[0].payload as TimelineData;

        // Create start and end dates for the month
        const startDate = new Date(clickedData.year, clickedData.month, 1);
        const endDate = new Date(clickedData.year, clickedData.month + 1, 0, 23, 59, 59);

        onTimeRangeSelect(startDate, endDate);
      }
    },
    [onTimeRangeSelect],
  );

  // Handle brush change for range selection
  const handleBrushChange = useCallback(
    (brushData: any) => {
      if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
        const startItem = timelineData[brushData.startIndex];
        const endItem = timelineData[brushData.endIndex];

        if (startItem && endItem) {
          const startDate = new Date(startItem.year, startItem.month, 1);
          const endDate = new Date(endItem.year, endItem.month + 1, 0, 23, 59, 59);
          onTimeRangeSelect(startDate, endDate);
        }
      }
    },
    [timelineData, onTimeRangeSelect],
  );

  // Custom tooltip
  const CustomTooltip = useCallback(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as TimelineData;
      return (
        <Box
          bg="white"
          p={3}
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="lg"
        >
          <Text fontWeight="medium" color="gray.800">
            {label}
          </Text>
          <Text color="blue.600">
            {data.messageCount} message{data.messageCount !== 1 ? 's' : ''}
          </Text>
          <Text fontSize="xs" color="gray.500">
            Click to navigate to this period
          </Text>
        </Box>
      );
    }
    return null;
  }, []);

  // Custom axis tick for better date display
  const CustomAxisTick = useCallback((props: any) => {
    const { x, y, payload } = props;
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#666" fontSize="12">
          {payload.value}
        </text>
      </g>
    );
  }, []);

  if (timelineData.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Text color="gray.500">No message data available</Text>
      </Box>
    );
  }

  // Show year range
  const startYear = timelineData[0]?.year;
  const endYear = timelineData[timelineData.length - 1]?.year;
  const yearRange = startYear === endYear ? `${startYear}` : `${startYear} - ${endYear}`;

  return (
    <VStack spacing={2} w="full">
      <Text fontSize="sm" color="gray.600" fontWeight="medium">
        Message Activity • {yearRange}
      </Text>

      <Box w="full" h="120px">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={timelineData}
            onClick={handleChartClick}
            margin={{ top: 5, right: 5, left: 5, bottom: 25 }}
          >
            <defs>
              <linearGradient id="messageGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3182ce" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3182ce" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <Area
              type="monotone"
              dataKey="messageCount"
              stroke="#3182ce"
              strokeWidth={2}
              fill="url(#messageGradient)"
              activeDot={{ r: 4, fill: '#3182ce' }}
            />

            <XAxis
              dataKey="monthYear"
              tick={<CustomAxisTick />}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />

            <YAxis hide />

            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

            <Tooltip content={<CustomTooltip />} />

            {currentPosition && (
              <ReferenceLine
                x={currentPosition}
                stroke="#e53e3e"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            )}

            <Brush
              dataKey="monthYear"
              height={20}
              stroke="#3182ce"
              fill="#3182ce"
              fillOpacity={0.1}
              onChange={handleBrushChange}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>

      <Text fontSize="xs" color="gray.500" textAlign="center">
        Click any point to jump to that time period • Drag the brush below to select a range
      </Text>
    </VStack>
  );
};