import React, { useEffect, useState } from 'react';
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
import type { ThreadMetadata } from '../types/messenger';

export const ConversationList: React.FC = () => {
  const navigate = useNavigate();
  const { directoryHandle } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<ThreadMetadata[]>([]);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    if (!directoryHandle) {
      navigate('/');
      return;
    }

    // Scan for threads
    scanForThreads();
  }, [directoryHandle, navigate]);

  const scanForThreads = async () => {
    if (!directoryHandle) return;

    try {
      setLoading(true);
      logger.debug('SCANNING_THREADS');

      const foundThreads: ThreadMetadata[] = [];

      // Scan inbox folder
      try {
        const inboxHandle = await directoryHandle.getDirectoryHandle('inbox');
        for await (const entry of inboxHandle.values()) {
          if (entry.kind === 'directory') {
            foundThreads.push({
              id: `inbox/${entry.name}`,
              participants: [],
              lastMessageTime: 0,
              totalMessages: 0,
              title: entry.name,
            });
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
            foundThreads.push({
              id: `e2ee_cutover/${entry.name}`,
              participants: [],
              lastMessageTime: 0,
              totalMessages: 0,
              title: entry.name,
            });
          }
        }
      } catch {
        logger.debug('NO_E2EE_FOLDER');
      }

      // If no subfolders found, scan current directory
      if (foundThreads.length === 0) {
        for await (const entry of directoryHandle.values()) {
          if (
            entry.kind === 'directory' &&
            !['photos', 'videos', 'gifs', 'audio', 'files'].includes(entry.name)
          ) {
            foundThreads.push({
              id: entry.name,
              participants: [],
              lastMessageTime: 0,
              totalMessages: 0,
              title: entry.name,
            });
          }
        }
      }

      logger.debug('THREADS_FOUND', { count: foundThreads.length });
      setThreads(foundThreads);
    } catch (error) {
      logger.error('SCAN_ERROR', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredThreads = threads.filter((thread) => {
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
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Box>
          <HStack mb={4}>
            <Icon as={FiMessageCircle} boxSize={8} color="blue.500" />
            <Heading size="lg">Your Conversations</Heading>
          </HStack>

          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg={bgColor}
            />
          </InputGroup>
        </Box>

        <Box>
          {loading ? (
            <VStack spacing={4} align="stretch">
              {[...Array(5)].map((_, i) => (
                <Box
                  key={i}
                  p={4}
                  bg={bgColor}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <HStack spacing={4}>
                    <Skeleton circle size="50px" />
                    <Box flex={1}>
                      <Skeleton height="20px" width="200px" mb={2} />
                      <SkeletonText noOfLines={1} width="300px" />
                    </Box>
                  </HStack>
                </Box>
              ))}
            </VStack>
          ) : filteredThreads.length === 0 ? (
            <Box
              p={8}
              bg={bgColor}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              textAlign="center"
            >
              <Icon as={FiFolder} boxSize={12} color="gray.400" mb={4} />
              <Text color="gray.500">
                {searchQuery ? 'No conversations match your search' : 'No conversations found'}
              </Text>
            </Box>
          ) : (
            <VStack spacing={4} align="stretch">
              {filteredThreads.map((thread) => {
                const hasData = thread.totalMessages > 0;

                return (
                  <Box
                    key={thread.id}
                    p={4}
                    bg={bgColor}
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor={borderColor}
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{ bg: hoverBg, transform: 'translateY(-2px)', shadow: 'md' }}
                    onClick={() => handleThreadClick(thread.id)}
                  >
                    <HStack spacing={4}>
                      <AvatarGroup size="md" max={2}>
                        {thread.participants.length > 0 ? (
                          thread.participants.map((p, i) => <Avatar key={i} name={p.name} />)
                        ) : (
                          <Avatar name={thread.title} />
                        )}
                      </AvatarGroup>

                      <Box flex={1}>
                        <HStack justify="space-between" mb={1}>
                          <Text fontWeight="semibold" fontSize="lg">
                            {thread.title ||
                              thread.participants.map((p) => p.name).join(', ') ||
                              'Unknown Thread'}
                          </Text>
                          {hasData && (
                            <Badge colorScheme="blue" variant="subtle">
                              {thread.totalMessages} messages
                            </Badge>
                          )}
                        </HStack>

                        <HStack spacing={4} color="gray.500" fontSize="sm">
                          {hasData ? (
                            <>
                              <Text>{thread.participants.length} participants</Text>
                              <Text>•</Text>
                              <Text>{formatDate(thread.lastMessageTime)}</Text>
                            </>
                          ) : (
                            <Text>Click to load messages</Text>
                          )}
                        </HStack>
                      </Box>
                    </HStack>
                  </Box>
                );
              })}
            </VStack>
          )}
        </Box>
      </VStack>
    </Container>
  );
};
