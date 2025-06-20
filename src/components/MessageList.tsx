import React, { useCallback, useRef, useEffect, useImperativeHandle } from 'react';
import { Virtuoso } from 'react-virtuoso';
import type { VirtuosoHandle, ListRange } from 'react-virtuoso';
import { Box } from '@chakra-ui/react';
import { MessageBubble } from './MessageBubble';
import { logger } from '../utils/logger';
import type { Message } from '../types/messenger';
import Fuse from 'fuse.js';

export interface MessageListHandle {
  navigateToNextResult: () => void;
  navigateToPrevResult: () => void;
  scrollToIndex: (
    index: number,
    options?: { behavior?: 'smooth' | 'auto'; align?: 'start' | 'center' | 'end' },
  ) => void;
}

interface MessageListProps {
  messages: Message[];
  searchQuery: string;
  onUpdateSearchResults: (count: number, currentIndexInResultsArray: number) => void;
  onVisibleDateChanged: (date: Date | null) => void; // New prop
}

export const MessageList = React.forwardRef<MessageListHandle, MessageListProps>(
  ({ messages, searchQuery, onUpdateSearchResults, onVisibleDateChanged }, ref) => {
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const searchResultsRef = useRef<number[]>([]);
    const currentSearchIndexRef = useRef(0);
    const isScrollingRef = useRef(false);

    useEffect(() => {
      logger.debug('LIST_MOUNTED', { messageCount: messages.length });
      return () => {
        logger.debug('LIST_UNMOUNTED');
      };
    }, [messages.length]);

    const jumpToMessage = useCallback((index: number) => {
      if (virtuosoRef.current) {
        logger.debug('SEARCH_JUMP', { index });
        virtuosoRef.current.scrollToIndex({
          index,
          behavior: 'smooth',
          align: 'center',
        });
      }
    }, []);

    const handleRangeChanged = useCallback(
      (range: ListRange) => {
        if (!isScrollingRef.current && messages[range.startIndex]) {
          const topMessage = messages[range.startIndex];
          const topMessageDate = new Date(topMessage.timestamp_ms);
          // Normalize to start of day for consistent comparison with heatmap cells
          const startOfDayDate = new Date(
            topMessageDate.getFullYear(),
            topMessageDate.getMonth(),
            topMessageDate.getDate(),
          );
          onVisibleDateChanged(startOfDayDate);
        }
      },
      [messages, onVisibleDateChanged],
    );

    useEffect(() => {
      if (searchQuery) {
        logger.debug('SEARCH_QUERY', { query: searchQuery });

        // Create Fuse instance for fuzzy search
        const fuse = new Fuse(messages, {
          keys: ['content', 'sender_name'],
          threshold: 0.4,
          includeScore: true,
        });

        const results = fuse.search(searchQuery);
        searchResultsRef.current = results.map((r) => r.refIndex);

        logger.debug('SEARCH_RESULTS_COUNT', { count: results.length });

        // Jump to first result and update search state
        if (results.length > 0) {
          currentSearchIndexRef.current = 0;
          jumpToMessage(searchResultsRef.current[0]);
          onUpdateSearchResults(searchResultsRef.current.length, currentSearchIndexRef.current);
        } else {
          currentSearchIndexRef.current = -1;
          onUpdateSearchResults(0, -1);
        }
      } else {
        searchResultsRef.current = [];
        currentSearchIndexRef.current = -1;
        onUpdateSearchResults(0, -1);
      }
    }, [searchQuery, messages, jumpToMessage, onUpdateSearchResults]);

    const navigateToNextResult = useCallback(() => {
      if (searchResultsRef.current.length === 0) return;
      let nextIndex = currentSearchIndexRef.current + 1;
      if (nextIndex >= searchResultsRef.current.length) {
        nextIndex = 0; // Wrap around to the first result
      }
      currentSearchIndexRef.current = nextIndex;
      jumpToMessage(searchResultsRef.current[currentSearchIndexRef.current]);
      onUpdateSearchResults(searchResultsRef.current.length, currentSearchIndexRef.current);
    }, [jumpToMessage, onUpdateSearchResults]);

    const navigateToPrevResult = useCallback(() => {
      if (searchResultsRef.current.length === 0) return;
      let prevIndex = currentSearchIndexRef.current - 1;
      if (prevIndex < 0) {
        prevIndex = searchResultsRef.current.length - 1; // Wrap around to the last result
      }
      currentSearchIndexRef.current = prevIndex;
      jumpToMessage(searchResultsRef.current[currentSearchIndexRef.current]);
      onUpdateSearchResults(searchResultsRef.current.length, currentSearchIndexRef.current);
    }, [jumpToMessage, onUpdateSearchResults]);

    useImperativeHandle(ref, () => ({
      navigateToNextResult,
      navigateToPrevResult,
      scrollToIndex: (index, options = { behavior: 'smooth', align: 'start' }) => {
        virtuosoRef.current?.scrollToIndex({ index, ...options });
      },
    }));

    const isMessageHighlighted = useCallback((index: number) => {
      return searchResultsRef.current.includes(index);
    }, []);

    const itemContent = useCallback(
      (index: number) => {
        const message = messages[index];
        const isHighlighted = Boolean(searchQuery && isMessageHighlighted(index));

        return (
          <Box px={4}>
            <MessageBubble
              message={message}
              isHighlighted={isHighlighted}
              searchQuery={searchQuery}
            />
          </Box>
        );
      },
      [messages, searchQuery, isMessageHighlighted],
    );

    return (
      <Box bg="gray.50" h="full" py={4}>
        <Virtuoso
          ref={virtuosoRef}
          data={messages}
          itemContent={itemContent}
          overscan={200}
          initialTopMostItemIndex={messages.length - 1}
          followOutput={false}
          style={{ height: '100%' }}
          isScrolling={(scrolling: boolean) => {
            isScrollingRef.current = scrolling;
          }}
          rangeChanged={handleRangeChanged}
        />
      </Box>
    );
  },
);
