import React from 'react';
import { Button, VStack, Text, Icon, useToast } from '@chakra-ui/react';
import { FiFolder } from 'react-icons/fi';
import { logger } from '../utils/logger';

interface FolderPickerProps {
  onDirectorySelected: (handle: FileSystemDirectoryHandle) => void;
}

export const FolderPicker: React.FC<FolderPickerProps> = ({ onDirectorySelected }) => {
  const toast = useToast();

  const handleFolderPick = async () => {
    try {
      logger.debug('DIR_PICKED', 'Opening directory picker');

      // Check if the File System Access API is supported
      if (!('showDirectoryPicker' in window)) {
        toast({
          title: 'Browser not supported',
          description:
            'Your browser does not support the File System Access API. Please use Chrome, Edge, or another compatible browser.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const dirHandle = await window.showDirectoryPicker({
        mode: 'read',
      });

      logger.debug('DIR_PICKED', { name: dirHandle.name });

      // Verify it contains a messages folder
      try {
        await dirHandle.getDirectoryHandle('inbox');
        onDirectorySelected(dirHandle);
      } catch {
        // Try to check if we're already inside the messages folder
        try {
          const entries = [];
          for await (const entry of dirHandle.values()) {
            entries.push(entry.name);
          }

          if (entries.some((name) => name === 'inbox' || name === 'e2ee_cutover')) {
            onDirectorySelected(dirHandle);
          } else {
            toast({
              title: 'Invalid folder',
              description: 'Please select the "messages" folder from your Facebook data export.',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          }
        } catch (error) {
          logger.error('DIR_PICKED_ERROR', error);
          toast({
            title: 'Error reading folder',
            description: 'Could not read the selected folder. Please try again.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        logger.error('DIR_PICKED_ERROR', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to open folder picker',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  return (
    <VStack spacing={8} align="center" justify="center" minH="400px">
      <Icon as={FiFolder} boxSize={20} color="blue.500" />
      <VStack spacing={4}>
        <Text fontSize="2xl" fontWeight="bold">
          Welcome to Messenger Archive Viewer
        </Text>
        <Text color="gray.600" textAlign="center" maxW="500px">
          Select your Facebook Messenger data export folder to begin browsing your conversations.
          Your data stays private and is processed entirely in your browser.
        </Text>
      </VStack>
      <Button
        colorScheme="blue"
        size="lg"
        onClick={handleFolderPick}
        leftIcon={<Icon as={FiFolder} />}
      >
        Select Messages Folder
      </Button>
      <Text fontSize="sm" color="gray.500" textAlign="center" maxW="400px">
        Select the "messages" folder from your Facebook data download
      </Text>
    </VStack>
  );
};
