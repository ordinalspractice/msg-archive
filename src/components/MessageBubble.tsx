import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { FiPlay, FiMusic } from 'react-icons/fi';
import ReactPlayer from 'react-player';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import type { Message } from '../types/messenger';
import { useAppContext } from '../context/AppContext';
import { getAvatarColor } from '../utils/avatarColors';
import { logger } from '../utils/logger';

interface MessageBubbleProps {
  message: Message;
  isHighlighted?: boolean;
  searchQuery?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isHighlighted = false,
  searchQuery = '',
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { currentUserName } = useAppContext();

  // Determine if this message is from the current user
  const isMyMessage = currentUserName && message.sender_name === currentUserName;

  // Message bubble colors
  const myMessageBg = useColorModeValue(
    isHighlighted ? 'yellow.100' : 'blue.500',
    isHighlighted ? 'yellow.900' : 'blue.600',
  );
  
  const otherMessageBg = useColorModeValue(
    isHighlighted ? 'yellow.100' : 'gray.100',
    isHighlighted ? 'yellow.900' : 'gray.700',
  );

  const bgColor = isMyMessage ? myMessageBg : otherMessageBg;
  const textColor = isMyMessage ? 'white' : 'black';

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const highlightText = (text: string) => {
    if (!searchQuery || !text) return text;

    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <Text as="mark" key={i} bg="yellow.300" px={1}>
          {part}
        </Text>
      ) : (
        part
      ),
    );
  };

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const lightboxSlides =
    message.photos?.map((photo) => ({
      src: photo.uri,
      alt: 'Message photo',
    })) || [];

  return (
    <>
      <HStack 
        spacing={3} 
        justify={isMyMessage ? 'flex-end' : 'flex-start'}
        align="flex-start"
        mb={4}
      >
        {/* Avatar for others (left side) */}
        {!isMyMessage && (
          <Avatar 
            name={message.sender_name} 
            size="sm" 
            bg={getAvatarColor(message.sender_name)} 
            color="white"
          />
        )}

        {/* Message content */}
        <VStack 
          align={isMyMessage ? 'flex-end' : 'flex-start'} 
          spacing={1} 
          maxW={{ base: "85%", md: "70%" }}
        >
          {/* Sender name and timestamp */}
          <HStack 
            spacing={2} 
            fontSize="xs" 
            color="gray.500"
            justify={isMyMessage ? 'flex-end' : 'flex-start'}
            w="full"
          >
            {!isMyMessage && (
              <Text fontWeight="medium">{highlightText(message.sender_name)}</Text>
            )}
            <Text>{formatTime(message.timestamp_ms)}</Text>
          </HStack>

          {/* Message bubble */}
          <Box 
            bg={bgColor} 
            px={{ base: 3, md: 4 }} 
            py={{ base: 2, md: 3 }} 
            borderRadius="2xl"
            borderTopRightRadius={isMyMessage ? "md" : "2xl"}
            borderTopLeftRadius={isMyMessage ? "2xl" : "md"}
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

            {message.photos && message.photos.length > 0 && (
              <Wrap spacing={2} mt={message.content ? 2 : 0}>
                {message.photos.map((photo, index) => (
                  <WrapItem key={index}>
                    <Image
                      src={photo.uri}
                      alt="Photo"
                      maxH="200px"
                      borderRadius="md"
                      cursor="pointer"
                      onClick={() => handleImageClick(index)}
                      loading="lazy"
                    />
                  </WrapItem>
                ))}
              </Wrap>
            )}

            {message.videos && message.videos.length > 0 && (
              <VStack align="stretch" spacing={2} mt={message.content ? 2 : 0}>
                {message.videos.map((video, index) => (
                  <AspectRatio key={index} ratio={16 / 9} maxW="400px">
                    <ReactPlayer url={video.uri} controls width="100%" height="100%" />
                  </AspectRatio>
                ))}
              </VStack>
            )}

            {message.audio_files && message.audio_files.length > 0 && (
              <VStack align="stretch" spacing={2} mt={message.content ? 2 : 0}>
                {message.audio_files.map((audio, index) => (
                  <HStack key={index} bg={isMyMessage ? "whiteAlpha.200" : "gray.200"} p={2} borderRadius="md">
                    <Icon as={FiMusic} color={isMyMessage ? "white" : "gray.600"} />
                    <ReactPlayer
                      url={audio.uri}
                      controls
                      width="200px"
                      height="40px"
                      config={{
                        file: {
                          forceAudio: true,
                        },
                      }}
                    />
                  </HStack>
                ))}
              </VStack>
            )}

            {message.sticker && <Image src={message.sticker.uri} alt="Sticker" maxH="150px" mt={message.content ? 2 : 0} />}

            {message.gifs && message.gifs.length > 0 && (
              <Wrap spacing={2} mt={message.content ? 2 : 0}>
                {message.gifs.map((gif, index) => (
                  <WrapItem key={index}>
                    <Image src={gif.uri} alt="GIF" maxH="200px" borderRadius="md" />
                  </WrapItem>
                ))}
              </Wrap>
            )}

            {message.reactions && message.reactions.length > 0 && (
              <HStack mt={2} spacing={1} flexWrap="wrap">
                {message.reactions.map((reaction, index) => (
                  <Badge 
                    key={index} 
                    colorScheme={isMyMessage ? "whiteAlpha" : "blue"} 
                    variant="subtle"
                    fontSize="xs"
                  >
                    {reaction.reaction} {reaction.actor}
                  </Badge>
                ))}
              </HStack>
            )}

            {message.is_unsent && (
              <Text fontStyle="italic" color={isMyMessage ? "whiteAlpha.700" : "gray.500"} fontSize="sm">
                Message unsent
              </Text>
            )}

            {message.call_duration && (
              <HStack color={isMyMessage ? "whiteAlpha.800" : "gray.600"} mt={message.content ? 2 : 0}>
                <Icon as={FiPlay} />
                <Text fontSize="sm">Call - {Math.round(message.call_duration / 60)} minutes</Text>
              </HStack>
            )}
          </Box>
        </VStack>

        {/* Avatar for current user (right side) */}
        {isMyMessage && (
          <Avatar 
            name={message.sender_name} 
            size="sm" 
            bg="blue.600" 
            color="white"
          />
        )}
      </HStack>

      {lightboxOpen && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={lightboxSlides}
          index={lightboxIndex}
        />
      )}
    </>
  );
};