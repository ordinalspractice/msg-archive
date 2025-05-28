import React, { useCallback, useRef, useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';
import type { VirtuosoHandle } from 'react-virtuoso';
import { Box } from '@chakra-ui/react';
import { MessageBubble } from './MessageBubble';
import { logger } from '../utils/logger';
import type { Message } from '../types/messenger';
import Fuse from 'fuse.js';

interface MessageListProps {
  messages: Message[];
  searchQuery: string;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, searchQuery }) => {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const searchResultsRef = useRef<number[]>([]);
  const currentSearchIndexRef = useRef(0);

  useEffect(() => {
    logger.debug('LIST_MOUNTED', { messageCount: messages.length });
    return () => {
      logger.debug('LIST_UNMOUNTED');
    };
  }, [messages.length]);

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

      // Jump to first result
      if (results.length > 0) {
        currentSearchIndexRef.current = 0;
        jumpToMessage(searchResultsRef.current[0]);
      }
    } else {
      searchResultsRef.current = [];
      currentSearchIndexRef.current = 0;
    }
  }, [searchQuery, messages]);

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

  const isMessageHighlighted = useCallback((index: number) => {
    return searchResultsRef.current.includes(index);
  }, []);

  const itemContent = useCallback(
    (index: number) => {
      const message = messages[index];
      const isHighlighted = searchQuery && isMessageHighlighted(index);

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
    <Box 
      bg="gray.50" 
      h="full"
      py={4}
    >
      <Virtuoso
        ref={virtuosoRef}
        data={messages}
        itemContent={itemContent}
        overscan={200}
        initialTopMostItemIndex={messages.length - 1}
        followOutput="smooth"
        style={{ height: '100%' }}
      />
    </Box>
  );
};
