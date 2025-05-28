import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Text,
  HStack,
  VStack,
  Image,
  Badge,
  useColorModeValue,
  AspectRatio,
  Icon,
  Wrap,
  WrapItem,
  Avatar,
  Link,
  Button,
  Skeleton,
  Tooltip,
} from '@chakra-ui/react';
import { FiPlay, FiMusic, FiDownload } from 'react-icons/fi';
import ReactPlayer from 'react-player';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import type { Message, Attachment as AttachmentType } from '../types/messenger';
import { useAppContext } from '../context/AppContext';
import { getAvatarColor } from '../utils/avatarColors';
import { logger } from '../utils/logger';

interface MessageBubbleProps {
  message: Message;
  isHighlighted?: boolean;
  searchQuery?: string;
}

// Helper component to manage individual media item loading and display
interface MediaItemProps {
  uri: string;
  altText: string;
  itemType: 'photo' | 'video' | 'audio' | 'gif' | 'sticker' | 'file';
  onImageClick?: () => void; // For photos/gifs to open lightbox
  fileName?: string; // For file attachments
}

const MediaItem: React.FC<MediaItemProps> = ({ uri, altText, itemType, onImageClick, fileName }) => {
  const { directoryHandle } = useAppContext();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    let currentObjectUrl: string | null = null;

    const loadMedia = async () => {
      if (!directoryHandle || !uri) {
        if (isActive) {
          // Check if it's an external URL (e.g. from a share)
          if (uri && (uri.startsWith('http://') || uri.startsWith('https://'))) {
            setObjectUrl(uri); // Use direct URL
            setIsLoading(false);
            return;
          }
          setError('Missing directory handle or URI');
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const pathSegments = uri.split('/');
        const fileName = pathSegments.pop();
        if (!fileName) {
          throw new Error('Invalid media URI (no filename)');
        }

        let currentFsHandle = directoryHandle;
        for (const segment of pathSegments) {
          if (segment === '.' || segment === '' || segment === 'your_facebook_activity' || segment === 'messages') {
             // Skip '.', '', and ignore potential "your_facebook_activity/messages/" prefix if it somehow remains
            if (segment === 'messages' && uri.startsWith('messages/')) {
                // This case should ideally not happen if worker normalized correctly,
                // but as a safeguard, if URI starts with "messages/", we assume directoryHandle is already "messages"
                // and we should not try to get "messages" dir handle again from itself.
                continue;
            } else if (segment === 'your_facebook_activity') {
                continue; // This segment should have been stripped by worker.
            } else if (segment) { // Ensure segment is not empty before trying to get handle
                 currentFsHandle = await currentFsHandle.getDirectoryHandle(segment);
            }
          } else {
             currentFsHandle = await currentFsHandle.getDirectoryHandle(segment);
          }
        }
        
        const fileHandle = await currentFsHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        
        currentObjectUrl = URL.createObjectURL(file);
        if (isActive) {
          setObjectUrl(currentObjectUrl);
        }
      } catch (err: any) {
        logger.error('MEDIA_LOAD_ERROR', { uri, type:itemType, error: err.message, stack: err.stack });
        if (isActive) {
          setError(`Failed: ${fileName || uri}`);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadMedia();

    return () => {
      isActive = false;
      if (currentObjectUrl && !currentObjectUrl.startsWith('http')) { // Don't revoke external URLs
        URL.revokeObjectURL(currentObjectUrl);
        logger.debug('MEDIA_URL_REVOKED', { url: currentObjectUrl });
      }
    };
  }, [directoryHandle, uri, itemType]);

  if (isLoading) {
    return <Skeleton height="100px" width="100px" borderRadius="md" />;
  }

  if (error) {
    return (
      <Box p={1} borderWidth="1px" borderRadius="md" borderColor="red.300" bg="red.50" maxW="150px">
        <Text fontSize="xs" color="red.500" isTruncated title={error}>{error}</Text>
      </Box>
    );
  }

  if (!objectUrl) return null;

  switch (itemType) {
    case 'photo':
    case 'gif':
    case 'sticker':
      return (
        <Image
          src={objectUrl}
          alt={altText}
          maxH={itemType === 'sticker' ? "100px" : "200px"} // Stickers usually smaller
          borderRadius="md"
          cursor={onImageClick ? "pointer" : "default"}
          onClick={onImageClick}
          loading="lazy"
          objectFit="contain"
        />
      );
    case 'video':
      return (
        <AspectRatio ratio={16 / 9} maxW="320px" w="full">
          <ReactPlayer url={objectUrl} controls width="100%" height="100%" />
        </AspectRatio>
      );
    case 'audio':
      return (
         <HStack>
          <Icon as={FiMusic} />
          <ReactPlayer
            url={objectUrl}
            controls
            width="250px"
            height="40px"
            config={{ file: { forceAudio: true } }}
          />
        </HStack>
      );
    case 'file':
      return (
        <Button as={Link} href={objectUrl} download={fileName || 'download'} leftIcon={<FiDownload />} size="sm" variant="outline">
          {fileName || 'Download File'}
        </Button>
      )
    default:
      return null;
  }
};


export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isHighlighted = false,
  searchQuery = '',
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSlides, setLightboxSlides] = useState<{ src: string; alt: string }[]>([]);
  const [currentLightboxIndex, setCurrentLightboxIndex] = useState(0);
  
  const { currentUserName, directoryHandle } = useAppContext(); // Get directoryHandle for MediaItem

  const isMyMessage = currentUserName && message.sender_name === currentUserName;
  
  const myMessageBg = useColorModeValue(
    isHighlighted ? 'yellow.200' : 'blue.500', // Slightly different highlight for own messages
    isHighlighted ? 'yellow.700' : 'blue.600',
  );
  
  const otherMessageBg = useColorModeValue(
    isHighlighted ? 'yellow.100' : 'gray.100',
    isHighlighted ? 'yellow.800' : 'gray.700', // Darker highlight for others in dark mode
  );

  const bgColor = isMyMessage ? myMessageBg : otherMessageBg;
  const textColor = isMyMessage ? 'white' : useColorModeValue('gray.800', 'whiteAlpha.900');
  const metaTextColor = isMyMessage ? 'blue.100' : useColorModeValue('gray.500', 'gray.400');


  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const highlightText = (text: string | undefined) => {
    if (!text) return '';
    if (!searchQuery) return text;

    const parts = text.split(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <Text as="mark" key={i} bg={isMyMessage ? "yellow.400" : "yellow.200"} color={isMyMessage ? "black" : "black"} px="1px">
          {part}
        </Text>
      ) : (
        part
      ),
    );
  };

  // Group reactions by emoji
  const groupedReactions = useMemo(() => {
    if (!message.reactions || message.reactions.length === 0) {
      return [];
    }

    const reactionMap = new Map<string, string[]>();
    
    message.reactions.forEach(reaction => {
      const emoji = reaction.reaction;
      const actor = reaction.actor;
      
      if (reactionMap.has(emoji)) {
        reactionMap.get(emoji)!.push(actor);
      } else {
        reactionMap.set(emoji, [actor]);
      }
    });

    return Array.from(reactionMap.entries()).map(([emoji, actors]) => ({
      emoji,
      actors,
      count: actors.length
    }));
  }, [message.reactions]);

  const collectLightboxSlides = useCallback(async () => {
    if (!message.photos || message.photos.length === 0 || !directoryHandle) {
      setLightboxSlides([]);
      return;
    }
  
    const resolvedSlides: { src: string; alt: string }[] = [];
    for (let i = 0; i < message.photos.length; i++) {
      const photo = message.photos[i];
      try {
        const pathSegments = photo.uri.split('/');
        const fileName = pathSegments.pop();
        if (!fileName) continue;
  
        let currentFsHandle = directoryHandle;
        for (const segment of pathSegments) {
            if (segment === '.' || segment === '' || segment === 'your_facebook_activity' || segment === 'messages') continue;
            if (segment) currentFsHandle = await currentFsHandle.getDirectoryHandle(segment);
        }
        const fileHandle = await currentFsHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const objectUrl = URL.createObjectURL(file);
        resolvedSlides.push({ src: objectUrl, alt: `Photo ${i + 1}` });
      } catch (err) {
        logger.error('LIGHTBOX_SLIDE_LOAD_ERROR', { uri: photo.uri, error: err });
        // Optionally add a placeholder for failed images or skip
      }
    }
    setLightboxSlides(resolvedSlides);
  
    // Cleanup function to revoke object URLs when component unmounts or slides change
    return () => {
      resolvedSlides.forEach(slide => URL.revokeObjectURL(slide.src));
    };
  }, [message.photos, directoryHandle]);
  
  useEffect(() => {
    let revokeUrls = () => {};
    if (lightboxOpen) { // Only resolve all if lightbox is to be opened
      collectLightboxSlides().then(cleanup => {
        if (cleanup) revokeUrls = cleanup;
      });
    }
    return () => revokeUrls(); // Revoke on unmount or when lightboxOpen changes
  }, [lightboxOpen, collectLightboxSlides]);


  const handleImageClick = (photoIndex: number) => {
    // Find the correct index in the potentially filtered/failed lightboxSlides
    // This logic assumes message.photos[photoIndex].uri was successfully resolved
    // and its objectUrl is present in lightboxSlides.
    // A more robust way would be to map original indices to lightboxSlides indices if some fail.
    // For now, let's assume all URIs are unique enough.
    if (message.photos && message.photos[photoIndex]) {
      // This is tricky because lightboxSlides contains objectURLs, not original URIs.
      // We set based on original photo array index. Lightbox must then use this index.
      // So, lightboxSlides must be in the same order as message.photos.
      // If collectLightboxSlides populates placeholders for errors, the index will match.
      setCurrentLightboxIndex(photoIndex); 
      setLightboxOpen(true);
    }
  };
  


  return (
    <>
      <HStack 
        spacing={3} 
        alignSelf={isMyMessage ? 'flex-end' : 'flex-start'}
        alignItems="flex-start" // Important for avatar and bubble alignment
        mb={4}
        w="full"
        justifyContent={isMyMessage ? "flex-end" : "flex-start"}
      >
        {!isMyMessage && (
          <Avatar 
            name={message.sender_name} 
            size="sm" 
            bg={getAvatarColor(message.sender_name)} 
            color="white"
            mt={6} // Align with sender name text, approx
          />
        )}

        <VStack 
          alignItems={isMyMessage ? 'flex-end' : 'flex-start'} 
          spacing={1} 
          maxW={{ base: "85%", md: "70%" }}
        >
          <HStack 
            spacing={2} 
            fontSize="xs" 
            color={metaTextColor}
            w="full"
            justifyContent={isMyMessage ? 'flex-end' : 'flex-start'}
          >
            {!isMyMessage && (
              <Text fontWeight="medium">{highlightText(message.sender_name)}</Text>
            )}
            <Text>{formatTime(message.timestamp_ms)}</Text>
          </HStack>

          <Box 
            bg={bgColor} 
            px={{ base: 3, md: 4 }} 
            py={{ base: 2, md: 3 }} 
            borderRadius="xl" // More rounded
            borderTopRightRadius={isMyMessage ? "md" : "xl"}
            borderTopLeftRadius={isMyMessage ? "xl" : "md"}
            maxW="full"
            boxShadow="sm"
          >
            {message.content && (
              <Text 
                whiteSpace="pre-wrap" 
                color={textColor}
                fontSize={{ base: "sm", md: "sm" }}
              >
                {highlightText(message.content)}
              </Text>
            )}

            {/* Photos */}
            {message.photos && message.photos.length > 0 && (
              <Wrap spacing={2} mt={message.content ? 2 : 0} justify={isMyMessage ? 'flex-end' : 'flex-start'}>
                {message.photos.map((photo, index) => (
                  <WrapItem key={photo.uri + "_" + index}>
                    <MediaItem
                      uri={photo.uri}
                      altText={`Photo ${index + 1}`}
                      itemType="photo"
                      onImageClick={() => handleImageClick(index)}
                    />
                  </WrapItem>
                ))}
              </Wrap>
            )}
            
            {/* Videos */}
             {message.videos && message.videos.length > 0 && (
              <VStack align="stretch" spacing={2} mt={message.content ? 2 : 0}>
                {message.videos.map((video, index) => (
                   <MediaItem key={video.uri + "_" + index} uri={video.uri} altText={`Video ${index+1}`} itemType="video"/>
                ))}
              </VStack>
            )}

            {/* Audio Files */}
            {message.audio_files && message.audio_files.length > 0 && (
              <VStack align="stretch" spacing={2} mt={message.content ? 2 : 0}>
                {message.audio_files.map((audio, index) => (
                  <MediaItem key={audio.uri + "_" + index} uri={audio.uri} altText={`Audio ${index+1}`} itemType="audio"/>
                ))}
              </VStack>
            )}

            {/* Sticker */}
            {message.sticker && (
               <Box mt={message.content ? 2 : 0}>
                <MediaItem uri={message.sticker.uri} altText="Sticker" itemType="sticker"/>
               </Box>
            )}
            
            {/* GIFs */}
            {message.gifs && message.gifs.length > 0 && (
              <Wrap spacing={2} mt={message.content ? 2 : 0} justify={isMyMessage ? 'flex-end' : 'flex-start'}>
                {message.gifs.map((gif, index) => (
                  <WrapItem key={gif.uri + "_" + index}>
                     <MediaItem uri={gif.uri} altText={`GIF ${index+1}`} itemType="gif"/>
                  </WrapItem>
                ))}
              </Wrap>
            )}

            {/* File Attachments */}
            {message.files && message.files.length > 0 && (
              <VStack align="stretch" spacing={2} mt={message.content ? 2 : 0}>
                {message.files.map((file: AttachmentType, index: number) => (
                  <MediaItem 
                    key={file.uri + "_" + index} 
                    uri={file.uri} 
                    altText={`File ${index+1}`} 
                    itemType="file"
                    fileName={file.uri.split('/').pop()} // Extract filename
                  />
                ))}
              </VStack>
            )}


            {groupedReactions && groupedReactions.length > 0 && (
              <HStack mt={2} spacing={1} flexWrap="wrap" justify={isMyMessage ? 'flex-end' : 'flex-start'}>
                {groupedReactions.map((reactionGroup, index) => {
                  const tooltipLabel = reactionGroup.actors
                    .map(actor => searchQuery ? highlightText(actor) : actor)
                    .join('\n');
                  
                  return (
                    <Tooltip 
                      key={`${reactionGroup.emoji}-${index}`}
                      label={tooltipLabel}
                      placement="top"
                      hasArrow
                      bg={useColorModeValue('gray.700', 'gray.300')}
                      color={useColorModeValue('white', 'gray.800')}
                    >
                      <Badge 
                        colorScheme={isMyMessage ? "whiteAlpha" : "gray"} 
                        variant={isMyMessage ? "solid" : "subtle"}
                        bg={isMyMessage ? "whiteAlpha.300" : "gray.200"}
                        color={isMyMessage ? "white" : "gray.700"}
                        fontSize="xs"
                        px={2} py={1} borderRadius="full"
                        cursor="default"
                        _hover={{
                          bg: isMyMessage ? "whiteAlpha.400" : "gray.300"
                        }}
                      >
                        <Text as="span" mr={1}>{reactionGroup.emoji}</Text>
                        <Text as="span" fontWeight="semibold">{reactionGroup.count}</Text>
                      </Badge>
                    </Tooltip>
                  );
                })}
              </HStack>
            )}

            {message.is_unsent && (
              <Text fontStyle="italic" color={isMyMessage ? "whiteAlpha.700" : "gray.500"} fontSize="xs" mt={1}>
                Message unsent
              </Text>
            )}

            {message.call_duration != null && ( // Check for null or undefined
              <HStack color={isMyMessage ? "whiteAlpha.800" : "gray.600"} mt={message.content ? 2 : 0}>
                <Icon as={FiPlay} />
                <Text fontSize="sm">
                  Call duration: {Math.round(message.call_duration / 60000)} min 
                  ({(message.call_duration / 1000).toFixed(0)}s)
                </Text>
              </HStack>
            )}
          </Box>
        </VStack>

        {isMyMessage && (
          <Avatar 
            name={message.sender_name} 
            size="sm" 
            bg="blue.600" 
            color="white"
            mt={6} // Align with sender name text
          />
        )}
      </HStack>

      {lightboxOpen && message.photos && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={lightboxSlides} // Use the state variable with resolved object URLs
          index={currentLightboxIndex}
        />
      )}
    </>
  );
};