import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Button,
  Text,
  Alert,
  AlertIcon,
  useToast,
  FormHelperText,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { FiKey, FiLock } from 'react-icons/fi';
import { logger } from '../utils/logger';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [rememberKey, setRememberKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // Load saved API key from localStorage if it exists
    const savedKey = localStorage.getItem('openrouter_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setRememberKey(true);
    }
  }, []);

  const validateApiKey = async (key: string): Promise<boolean> => {
    if (!key) return false;

    try {
      logger.debug('LLM_REQUEST_START', { endpoint: 'models' });

      const response = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'HEAD',
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });

      if (response.ok) {
        return true;
      } else {
        logger.debug('LLM_REQUEST_ERROR', { status: response.status });
        return false;
      }
    } catch (error) {
      logger.error('LLM_REQUEST_ERROR', error);
      return false;
    }
  };

  const handleSave = async () => {
    if (!apiKey) {
      toast({
        title: 'API Key Required',
        description: 'Please enter your OpenRouter API key.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsValidating(true);
    const isValid = await validateApiKey(apiKey);
    setIsValidating(false);

    if (!isValid) {
      toast({
        title: 'Invalid API Key',
        description: 'The API key could not be validated. Please check and try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Save to localStorage if remember is checked
    if (rememberKey) {
      localStorage.setItem('openrouter_api_key', apiKey);
    } else {
      localStorage.removeItem('openrouter_api_key');
    }

    // Store in session context (would need to implement this in AppContext)
    toast({
      title: 'Settings Saved',
      description: 'Your OpenRouter API key has been saved successfully.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });

    onClose();
  };

  const handleClear = () => {
    setApiKey('');
    setRememberKey(false);
    localStorage.removeItem('openrouter_api_key');

    toast({
      title: 'API Key Cleared',
      description: 'Your API key has been removed.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Settings</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={6} align="stretch">
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">
                Future feature: Enable semantic search using AI. Your API key will be used to
                generate embeddings and search through your messages intelligently.
              </Text>
            </Alert>

            <FormControl>
              <FormLabel>
                <HStack>
                  <Icon as={FiKey} />
                  <Text>OpenRouter API Key</Text>
                </HStack>
              </FormLabel>
              <Input
                type="password"
                placeholder="sk-or-v1-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <FormHelperText>
                Get your API key from{' '}
                <Text as="a" href="https://openrouter.ai/keys" target="_blank" color="blue.500">
                  openrouter.ai/keys
                </Text>
              </FormHelperText>
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="remember-key" mb="0">
                <HStack>
                  <Icon as={FiLock} />
                  <Text>Remember API Key</Text>
                </HStack>
              </FormLabel>
              <Switch
                id="remember-key"
                isChecked={rememberKey}
                onChange={(e) => setRememberKey(e.target.checked)}
              />
            </FormControl>

            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">
                Your data stays private. The API key is only stored locally in your browser and is
                never sent to any server except OpenRouter for AI processing.
              </Text>
            </Alert>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClear}>
            Clear
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            isLoading={isValidating}
            loadingText="Validating..."
          >
            Save Settings
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
