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
} from '@chakra-ui/react';
import { FiPlay, FiMusic } from 'react-icons/fi';
import ReactPlayer from 'react-player';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import type { Message } from '../types/messenger';

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

  const bgColor = useColorModeValue(
    isHighlighted ? 'yellow.100' : 'gray.100',
    isHighlighted ? 'yellow.900' : 'gray.700',
  );

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
      <VStack align="stretch" spacing={2}>
        <HStack justify="space-between" fontSize="sm" color="gray.600">
          <Text fontWeight="semibold">{highlightText(message.sender_name)}</Text>
          <Text>{formatTime(message.timestamp_ms)}</Text>
        </HStack>

        <Box bg={bgColor} px={4} py={2} borderRadius="lg" maxW="70%">
          {message.content && <Text whiteSpace="pre-wrap">{highlightText(message.content)}</Text>}

          {message.photos && message.photos.length > 0 && (
            <Wrap spacing={2} mt={2}>
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
            <VStack align="stretch" spacing={2} mt={2}>
              {message.videos.map((video, index) => (
                <AspectRatio key={index} ratio={16 / 9} maxW="400px">
                  <ReactPlayer url={video.uri} controls width="100%" height="100%" />
                </AspectRatio>
              ))}
            </VStack>
          )}

          {message.audio_files && message.audio_files.length > 0 && (
            <VStack align="stretch" spacing={2} mt={2}>
              {message.audio_files.map((audio, index) => (
                <HStack key={index} bg="gray.200" p={2} borderRadius="md">
                  <Icon as={FiMusic} />
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

          {message.sticker && <Image src={message.sticker.uri} alt="Sticker" maxH="150px" mt={2} />}

          {message.gifs && message.gifs.length > 0 && (
            <Wrap spacing={2} mt={2}>
              {message.gifs.map((gif, index) => (
                <WrapItem key={index}>
                  <Image src={gif.uri} alt="GIF" maxH="200px" borderRadius="md" />
                </WrapItem>
              ))}
            </Wrap>
          )}

          {message.reactions && message.reactions.length > 0 && (
            <HStack mt={2} spacing={1}>
              {message.reactions.map((reaction, index) => (
                <Badge key={index} colorScheme="blue" variant="subtle">
                  {reaction.reaction} - {reaction.actor}
                </Badge>
              ))}
            </HStack>
          )}

          {message.is_unsent && (
            <Text fontStyle="italic" color="gray.500">
              Message unsent
            </Text>
          )}

          {message.call_duration && (
            <HStack color="gray.600">
              <Icon as={FiPlay} />
              <Text>Call - {Math.round(message.call_duration / 60)} minutes</Text>
            </HStack>
          )}
        </Box>
      </VStack>

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
