import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  IconButton,
  Progress,
  useToast,
  Spinner,
  Center,
  useDisclosure,
  Alert,
  AlertIcon,
  Button,
} from '@chakra-ui/react';
import { FiArrowLeft, FiSettings } from 'react-icons/fi';
import { useAppContext } from '../context/AppContext';
import { useMessageParser } from '../hooks/useMessageParser';
import { MessageList, type MessageListHandle } from '../components/MessageList';
import { SearchBar } from '../components/SearchBar';
import { MessageTimeline } from '../components/MessageTimeline';
import { Settings } from '../components/Settings';
import { logger } from '../utils/logger';
import type { ParsedThread } from '../types/messenger';

export const ConversationView: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const {
    directoryHandle,
    getThread,
    addThread,
    isThreadLoading,
    setThreadLoading,
    parseProgress,
    setParseProgress,
    currentUserName,
  } = useAppContext();

  const [thread, setThread] = useState<ParsedThread | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResultCount, setSearchResultCount] = useState(0);
  const [currentSearchResultIndex, setCurrentSearchResultIndex] = useState(-1); // 0-based internal index
  const [currentVisibleDateInList, setCurrentVisibleDateInList] = useState<Date | null>(null);
  const messageListRef = useRef<MessageListHandle>(null);
  const {
    isOpen: isSettingsOpen,
    onOpen: onOpenSettings,
    onClose: onCloseSettings,
  } = useDisclosure();

  const decodedThreadId = threadId ? decodeURIComponent(threadId) : '';

  const handleUpdateSearchResults = useCallback(
    (count: number, currentIndexInResultsArray: number) => {
      setSearchResultCount(count);
      setCurrentSearchResultIndex(currentIndexInResultsArray);
    },
    [],
  );

  const handleNavigateNextResult = useCallback(() => {
    messageListRef.current?.navigateToNextResult();
  }, []);

  const handleNavigatePrevResult = useCallback(() => {
    messageListRef.current?.navigateToPrevResult();
  }, []);

  const handleVisibleDateChanged = useCallback((date: Date | null) => {
    setCurrentVisibleDateInList(date);
  }, []);

  const handleTimeRangeSelect = useCallback(
    (startDate: Date, endDate: Date) => {
      if (!thread || !messageListRef.current) return;

      const startTimestamp = startDate.getTime();
      const endTimestamp = endDate.getTime();

      // Find the first message in the selected time range
      let messageIndex = -1;
      for (let i = 0; i < thread.messages.length; i++) {
        const msgTimestamp = thread.messages[i].timestamp_ms;
        if (msgTimestamp >= startTimestamp && msgTimestamp <= endTimestamp) {
          messageIndex = i;
          break;
        }
      }

      if (messageIndex !== -1) {
        messageListRef.current?.scrollToIndex(messageIndex, { align: 'start', behavior: 'smooth' });
        setCurrentVisibleDateInList(startDate);
      } else {
        // Find the closest message before or after the range
        let closestIndex = -1;
        let closestDistance = Infinity;

        for (let i = 0; i < thread.messages.length; i++) {
          const msgTimestamp = thread.messages[i].timestamp_ms;
          const distance = Math.min(
            Math.abs(msgTimestamp - startTimestamp),
            Math.abs(msgTimestamp - endTimestamp),
          );

          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = i;
          }
        }

        if (closestIndex !== -1) {
          messageListRef.current?.scrollToIndex(closestIndex, {
            align: 'start',
            behavior: 'smooth',
          });
          toast({
            title: 'Navigated to closest messages',
            description: `No messages in selected range. Showing closest messages.`,
            status: 'info',
            duration: 2000,
            isClosable: true,
          });
        }
      }
    },
    [thread, toast],
  );

  const handleThreadParsed = useCallback(
    (parsedThread: ParsedThread) => {
      logger.debug('THREAD_READY', { threadId: parsedThread.threadId });
      addThread(parsedThread);
      if (parsedThread.threadId === decodedThreadId) {
        setThread(parsedThread);
      }
    },
    [addThread, decodedThreadId],
  );

  const handleProgress = useCallback(
    (threadId: string, progress: number, data?: any) => {
      logger.debug('PARSE_PROGRESS', { threadId, progress, data });
      setParseProgress(threadId, progress);
    },
    [setParseProgress],
  );

  const handleError = useCallback(
    (threadId: string, error: string) => {
      logger.error('THREAD_FAILED', { threadId, error });
      setThreadLoading(threadId, false);
      toast({
        title: 'Failed to load conversation',
        description: error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
    [setThreadLoading, toast],
  );

  const { parseThread } = useMessageParser({
    onThreadParsed: handleThreadParsed,
    onProgress: handleProgress,
    onError: handleError,
  });

  // User detection is handled globally in AppContext - no per-conversation detection

  useEffect(() => {
    if (!directoryHandle || !decodedThreadId) {
      navigate('/');
      return;
    }

    // Check if thread is already loaded
    const existingThread = getThread(decodedThreadId);
    if (existingThread) {
      setThread(existingThread);
      return;
    }

    // Start loading the thread
    if (!isThreadLoading(decodedThreadId)) {
      logger.debug('THREAD_LOADING', { threadId: decodedThreadId });
      setThreadLoading(decodedThreadId, true);
      parseThread(directoryHandle, decodedThreadId);
    }
  }, [
    directoryHandle,
    decodedThreadId,
    getThread,
    isThreadLoading,
    navigate,
    parseThread,
    setThreadLoading,
  ]);

  const handleBack = () => {
    navigate('/');
  };

  const progress = parseProgress.get(decodedThreadId);
  const loading = isThreadLoading(decodedThreadId);

  // Now we can safely do conditional rendering after all hooks are called
  if (loading && !thread) {
    return (
      <Box h="100vh" bg="gray.50" w="full" display="flex" flexDirection="column" overflow="hidden">
        {/* Header */}
        <Box
          bg="white"
          borderBottomWidth="1px"
          borderColor="gray.200"
          px={{ base: 2, md: 4 }}
          py={4}
          boxShadow="sm"
        >
          <Box maxW="1200px" mx="auto" w="full">
            <HStack>
              <IconButton
                aria-label="Back"
                icon={<FiArrowLeft />}
                onClick={handleBack}
                variant="ghost"
                size="lg"
              />
              <Heading size="md" color="gray.800">
                Loading Conversation...
              </Heading>
            </HStack>
          </Box>
        </Box>

        {/* Loading Content */}
        <Box maxW="1200px" mx="auto" px={4} py={8}>
          <Box bg="white" p={8} borderRadius="lg" boxShadow="sm">
            <VStack spacing={6}>
              <Spinner size="xl" color="blue.500" />
              <Text color="gray.600" fontSize="lg">
                Parsing messages...
              </Text>
              {progress !== undefined && (
                <Box w="full" maxW="md">
                  <Progress value={progress} w="full" colorScheme="blue" size="lg" />
                  <Text fontSize="sm" color="gray.500" textAlign="center" mt={2}>
                    {progress}% complete
                  </Text>
                </Box>
              )}
            </VStack>
          </Box>
        </Box>
      </Box>
    );
  }

  if (!thread) {
    return (
      <Box h="100vh" bg="gray.50" w="full" display="flex" flexDirection="column" overflow="hidden">
        <Box maxW="1200px" mx="auto" px={4} py={8}>
          <Center minH="60vh">
            <VStack spacing={4}>
              <Text fontSize="lg" color="gray.600">
                Conversation not found
              </Text>
              <IconButton
                aria-label="Back"
                icon={<FiArrowLeft />}
                onClick={handleBack}
                colorScheme="blue"
                size="lg"
              />
            </VStack>
          </Center>
        </Box>
      </Box>
    );
  }

  const participantNames = thread.participants.map((p) => p.name).join(', ');
  const title = thread.title || participantNames || 'Conversation';

  return (
    <Box h="100vh" bg="gray.50" w="full" display="flex" flexDirection="column" overflow="hidden">
      {/* Header */}
      <Box
        bg="white"
        borderBottomWidth="1px"
        borderColor="gray.200"
        px={{ base: 2, md: 4 }}
        py={4}
        boxShadow="sm"
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Box maxW="1200px" mx="auto" w="full">
          <HStack>
            <IconButton
              aria-label="Back to conversations"
              icon={<FiArrowLeft />}
              onClick={handleBack}
              variant="ghost"
              size="lg"
            />
            <Box flex={1}>
              <Heading size="md" color="gray.800">
                {title}
              </Heading>
              <Text color="gray.500" fontSize="sm">
                {thread.messages.length} messages • {thread.participants.length} participants
              </Text>
            </Box>
            <IconButton
              aria-label="Settings"
              icon={<FiSettings />}
              onClick={onOpenSettings}
              variant="ghost"
              size="lg"
            />
          </HStack>
        </Box>
      </Box>

      {/* Sticky Header: Search and Timeline */}
      <Box
        position="sticky"
        top={0}
        zIndex={10}
        bg="white"
        borderBottomWidth="1px"
        borderColor="gray.200"
        boxShadow="sm"
      >
        {/* Search Bar */}
        <Box px={{ base: 2, md: 4 }} py={3}>
          <Box maxW="1200px" mx="auto" w="full">
            <SearchBar
              onSearch={setSearchQuery}
              searchResultCount={searchResultCount}
              currentResultIndex={
                currentSearchResultIndex === -1 ? 0 : currentSearchResultIndex + 1
              } // Display 1-based
              onNavigateNext={handleNavigateNextResult}
              onNavigatePrev={handleNavigatePrevResult}
            />
          </Box>
        </Box>
        {/* Timeline (always visible) */}
        <Box px={{ base: 2, md: 4 }} py={3}>
          <Box maxW="1200px" mx="auto" w="full">
            <MessageTimeline
              messages={thread.messages}
              onTimeRangeSelect={handleTimeRangeSelect}
              currentVisibleDate={currentVisibleDateInList}
            />
          </Box>
        </Box>
      </Box>

      {/* User identification banner */}
      {!currentUserName && (
        <Box
          bg="blue.50"
          borderBottomWidth="1px"
          borderColor="blue.200"
          px={{ base: 2, md: 4 }}
          py={3}
        >
          <Box maxW="1200px" mx="auto" w="full">
            <Alert status="info" borderRadius="md" bg="transparent" p={2}>
              <AlertIcon color="blue.500" />
              <Text fontSize="sm" color="blue.700" flex={1}>
                To see your messages on the right (blue), set your name in settings.
              </Text>
              <Button size="xs" colorScheme="blue" variant="outline" onClick={onOpenSettings}>
                Open Settings
              </Button>
            </Alert>
          </Box>
        </Box>
      )}

      {/* Messages */}
      <Box flex={1} maxW="1200px" mx="auto" w="full" px={{ base: 2, md: 4 }} minH={0} h="full">
        <MessageList
          ref={messageListRef}
          messages={thread.messages}
          searchQuery={searchQuery}
          onUpdateSearchResults={handleUpdateSearchResults}
          onVisibleDateChanged={handleVisibleDateChanged}
        />
      </Box>

      <Settings isOpen={isSettingsOpen} onClose={onCloseSettings} />
    </Box>
  );
};
