import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
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
} from '@chakra-ui/react';
import { FiArrowLeft, FiSettings } from 'react-icons/fi';
import { useAppContext } from '../context/AppContext';
import { useMessageParser } from '../hooks/useMessageParser';
import { MessageList } from '../components/MessageList';
import { SearchBar } from '../components/SearchBar';
import { TimelineHeatmap } from '../components/TimelineHeatmap';
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
  } = useAppContext();

  const [thread, setThread] = useState<ParsedThread | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTimeline, setShowTimeline] = useState(false);
  const {
    isOpen: isSettingsOpen,
    onOpen: onOpenSettings,
    onClose: onCloseSettings,
  } = useDisclosure();

  const decodedThreadId = threadId ? decodeURIComponent(threadId) : '';

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

  if (loading && !thread) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8}>
          <HStack w="full">
            <IconButton
              aria-label="Back"
              icon={<FiArrowLeft />}
              onClick={handleBack}
              variant="ghost"
            />
            <Heading size="lg" flex={1}>
              Loading Conversation...
            </Heading>
          </HStack>

          <Box w="full" bg="white" p={8} borderRadius="lg" shadow="sm">
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" />
              <Text color="gray.600">Parsing messages...</Text>
              {progress !== undefined && (
                <>
                  <Progress value={progress} w="full" colorScheme="blue" />
                  <Text fontSize="sm" color="gray.500">
                    {progress}% complete
                  </Text>
                </>
              )}
            </VStack>
          </Box>
        </VStack>
      </Container>
    );
  }

  if (!thread) {
    return (
      <Container maxW="container.xl" py={8}>
        <Center minH="400px">
          <VStack>
            <Text>Conversation not found</Text>
            <IconButton
              aria-label="Back"
              icon={<FiArrowLeft />}
              onClick={handleBack}
              variant="ghost"
            />
          </VStack>
        </Center>
      </Container>
    );
  }

  const participantNames = thread.participants.map((p) => p.name).join(', ');
  const title = thread.title || participantNames || 'Conversation';

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <HStack>
          <IconButton
            aria-label="Back to conversations"
            icon={<FiArrowLeft />}
            onClick={handleBack}
            variant="ghost"
          />
          <Box flex={1}>
            <Heading size="lg">{title}</Heading>
            <Text color="gray.600" fontSize="sm">
              {thread.messages.length} messages • {thread.participants.length} participants
            </Text>
          </Box>
          <IconButton
            aria-label="Settings"
            icon={<FiSettings />}
            onClick={onOpenSettings}
            variant="ghost"
          />
        </HStack>

        <SearchBar
          onSearch={setSearchQuery}
          onToggleTimeline={() => setShowTimeline(!showTimeline)}
          showTimeline={showTimeline}
        />

        {showTimeline && <TimelineHeatmap messages={thread.messages} />}

        <MessageList messages={thread.messages} searchQuery={searchQuery} />

        <Settings isOpen={isSettingsOpen} onClose={onCloseSettings} />
      </VStack>
    </Container>
  );
};
