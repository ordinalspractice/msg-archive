import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Heading,
  Badge,
  Avatar,
  AvatarGroup,
  useColorModeValue,
  Container,
  Icon,
  Skeleton,
  SkeletonText,
} from '@chakra-ui/react';
import { FiSearch, FiMessageCircle, FiFolder } from 'react-icons/fi';
import { useAppContext } from '../context/AppContext';
import { logger } from '../utils/logger';
import { readFileWithProperEncoding, fixEncoding } from '../utils/encoding';
import { ThreadSchema } from '../types/messenger';
import type { ThreadMetadata } from '../types/messenger';
import { getAvatarColor } from '../utils/avatarColors';

export const ConversationList: React.FC = () => {
  const navigate = useNavigate();
  const { directoryHandle, threadMetadata, loadInitialThreads } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const parseThreadMetadata = async (
    threadHandle: FileSystemDirectoryHandle,
    threadId: string,
  ): Promise<ThreadMetadata> => {
    try {
      // Try to get message_1.json file
      const messageFile = await threadHandle.getFileHandle('message_1.json');
      const file = await messageFile.getFile();
      const fixedText = await readFileWithProperEncoding(file);
      const data = JSON.parse(fixedText);
      const validatedData = ThreadSchema.parse(data);

      // Extract metadata
      const participants = validatedData.participants.map((p) => ({
        ...p,
        name: fixEncoding(p.name),
      }));

      const lastMessage = validatedData.messages[validatedData.messages.length - 1];
      const lastMessageTime = lastMessage?.timestamp_ms || 0;
      const title = validatedData.title ? fixEncoding(validatedData.title) : undefined;

      return {
        id: threadId,
        participants,
        lastMessageTime,
        totalMessages: validatedData.messages.length,
        title,
      };
    } catch (error) {
      logger.debug('PARSE_METADATA_ERROR', { threadId, error });
      // Fallback to folder name if parsing fails
      return {
        id: threadId,
        participants: [],
        lastMessageTime: 0,
        totalMessages: 0,
        title: threadId.split('/').pop(),
      };
    }
  };

  const scanForThreads = useCallback(async () => {
    if (!directoryHandle) return;

    try {
      setLoading(true);
      logger.debug('SCANNING_THREADS');

      const threadPromises: Promise<ThreadMetadata>[] = [];

      // Scan inbox folder
      try {
        const inboxHandle = await directoryHandle.getDirectoryHandle('inbox');
        for await (const entry of inboxHandle.values()) {
          if (entry.kind === 'directory') {
            const threadId = `inbox/${entry.name}`;
            threadPromises.push(parseThreadMetadata(entry as FileSystemDirectoryHandle, threadId));
          }
        }
      } catch {
        logger.debug('NO_INBOX_FOLDER');
      }

      // Scan e2ee_cutover folder
      try {
        const e2eeHandle = await directoryHandle.getDirectoryHandle('e2ee_cutover');
        for await (const entry of e2eeHandle.values()) {
          if (entry.kind === 'directory') {
            const threadId = `e2ee_cutover/${entry.name}`;
            threadPromises.push(parseThreadMetadata(entry as FileSystemDirectoryHandle, threadId));
          }
        }
      } catch {
        logger.debug('NO_E2EE_FOLDER');
      }

      // If no subfolders found, scan current directory
      if (threadPromises.length === 0) {
        for await (const entry of directoryHandle.values()) {
          if (
            entry.kind === 'directory' &&
            !['photos', 'videos', 'gifs', 'audio', 'files'].includes(entry.name)
          ) {
            threadPromises.push(
              parseThreadMetadata(entry as FileSystemDirectoryHandle, entry.name),
            );
          }
        }
      }

      logger.debug('PARSING_THREADS', { count: threadPromises.length });

      // Parse all threads in parallel
      const foundThreads = await Promise.all(threadPromises);

      logger.debug('THREADS_PARSED', { count: foundThreads.length });
      loadInitialThreads(foundThreads);
    } catch (error) {
      logger.error('SCAN_ERROR', error);
    } finally {
      setLoading(false);
    }
  }, [directoryHandle, loadInitialThreads]);

  useEffect(() => {
    if (!directoryHandle) {
      navigate('/');
      return;
    }

    // Only scan if threadMetadata is not already populated
    if (threadMetadata.length === 0) {
      setLoading(true);
      scanForThreads();
    } else {
      setLoading(false);
    }
  }, [directoryHandle, navigate, threadMetadata, scanForThreads]);

  const filteredThreads = threadMetadata.filter((thread) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      thread.title?.toLowerCase().includes(query) ||
      thread.participants.some((p) => p.name.toLowerCase().includes(query))
    );
  });

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  };

  const handleThreadClick = (threadId: string) => {
    navigate(`/conversation/${encodeURIComponent(threadId)}`);
  };

  return (
    <Box minH="100vh" bg="gray.50" w="full">
      {/* Header */}
      <Box 
        bg="white" 
        borderBottomWidth="1px" 
        borderColor={borderColor}
        px={{ base: 2, md: 4 }} 
        py={4}
        position="sticky"
        top={0}
        zIndex={10}
        boxShadow="sm"
      >
        <Box maxW="1200px" mx="auto" w="full">
          <VStack spacing={4}>
            <HStack w="full" justify="space-between">
              <HStack>
                <Icon as={FiMessageCircle} boxSize={6} color="blue.500" />
                <Heading size="md" color="gray.800">Messenger Archive</Heading>
              </HStack>
            </HStack>
            <InputGroup maxW="md">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="gray.50"
                border="none"
                _focus={{ bg: "white", boxShadow: "outline" }}
                borderRadius="full"
              />
            </InputGroup>
          </VStack>
        </Box>
      </Box>

      {/* Content */}
      <Box maxW="1200px" mx="auto" px={{ base: 2, md: 4 }} py={6} w="full">
        <VStack spacing={0} align="stretch">

          {loading ? (
            <VStack spacing={0} align="stretch">
              {[...Array(8)].map((_, i) => (
                <Box
                  key={i}
                  p={4}
                  bg="white"
                  borderBottomWidth="1px"
                  borderColor={borderColor}
                >
                  <HStack spacing={3}>
                    <Skeleton height="48px" width="48px" borderRadius="full" />
                    <Box flex={1}>
                      <Skeleton height="16px" width="60%" mb={2} />
                      <SkeletonText noOfLines={1} width="40%" />
                    </Box>
                    <Skeleton height="12px" width="50px" />
                  </HStack>
                </Box>
              ))}
            </VStack>
          ) : filteredThreads.length === 0 ? (
            <Box
              p={12}
              bg="white"
              textAlign="center"
              borderRadius="lg"
              mx={4}
            >
              <Icon as={FiFolder} boxSize={16} color="gray.300" mb={4} />
              <Text color="gray.500" fontSize="lg">
                {searchQuery ? 'No conversations match your search' : 'No conversations found'}
              </Text>
            </Box>
          ) : (
            <Box bg="white" borderRadius="lg" overflow="hidden" boxShadow="sm">
              {filteredThreads.map((thread, index) => {
                const hasData = thread.totalMessages > 0;

                return (
                  <Box
                    key={thread.id}
                    p={4}
                    cursor="pointer"
                    transition="all 0.15s ease"
                    _hover={{ bg: "blue.50" }}
                    borderBottomWidth={index < filteredThreads.length - 1 ? "1px" : "0"}
                    borderColor={borderColor}
                    onClick={() => handleThreadClick(thread.id)}
                  >
                    <HStack spacing={3}>
                      <AvatarGroup size="md" max={2}>
                        {thread.participants.length > 0 ? (
                          thread.participants.map((p, i) => (
                            <Avatar 
                              key={i} 
                              name={p.name} 
                              size="md"
                              bg={getAvatarColor(p.name)}
                              color="white"
                            />
                          ))
                        ) : (
                          <Avatar 
                            name={thread.title || "Unknown"} 
                            size="md"
                            bg="gray.500"
                            color="white"
                          />
                        )}
                      </AvatarGroup>

                      <Box flex={1} minW={0}>
                        <HStack justify="space-between" mb={1}>
                          <Text 
                            fontWeight="600" 
                            fontSize="md"
                            color="gray.900"
                            isTruncated
                            flex={1}
                          >
                            {thread.title ||
                              thread.participants.map((p) => p.name).join(', ') ||
                              'Unknown Thread'}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {hasData && formatDate(thread.lastMessageTime)}
                          </Text>
                        </HStack>

                        <HStack spacing={2} color="gray.500" fontSize="sm">
                          {hasData ? (
                            <Text isTruncated>
                              {thread.participants.length} participant{thread.participants.length !== 1 ? 's' : ''} • {thread.totalMessages} messages
                            </Text>
                          ) : (
                            <Text>Click to load messages</Text>
                          )}
                        </HStack>
                      </Box>
                    </HStack>
                  </Box>
                );
              })}
            </Box>
          )}
        </VStack>
      </Box>
    </Box>
  );
};
