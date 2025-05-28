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
  Divider,
} from '@chakra-ui/react';
import { FiKey, FiLock, FiUser } from 'react-icons/fi';
import { logger } from '../utils/logger';
import { useAppContext } from '../context/AppContext';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [rememberKey, setRememberKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [userName, setUserName] = useState('');
  const { currentUserName, setCurrentUserName } = useAppContext();
  const toast = useToast();

  useEffect(() => {
    // Load saved API key from localStorage if it exists
    const savedKey = localStorage.getItem('openrouter_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setRememberKey(true);
    }

    // Load current user name
    if (currentUserName) {
      setUserName(currentUserName);
    }
  }, [currentUserName]);

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

  // Immediately apply user name changes for real-time feedback
  const handleUserNameChange = (value: string) => {
    setUserName(value);
    // Apply immediately if not empty
    if (value.trim()) {
      setCurrentUserName(value.trim());
    }
  };

  const handleSave = async () => {
    // Save user name (already applied via handleUserNameChange)
    if (userName.trim()) {
      setCurrentUserName(userName.trim());
    }

    // Save API key if provided
    if (apiKey) {
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
    }

    toast({
      title: 'Settings Saved',
      description: 'Your settings have been saved successfully.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });

    onClose();
  };

  const handleClear = () => {
    setApiKey('');
    setRememberKey(false);
    setUserName('');
    setCurrentUserName(null);
    localStorage.removeItem('openrouter_api_key');

    toast({
      title: 'Settings Cleared',
      description: 'Your settings have been cleared.',
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
            {currentUserName ? (
              <Alert status="success" borderRadius="md">
                <AlertIcon />
                <VStack align="start" spacing={1} flex={1}>
                  <Text fontSize="sm">
                    <strong>✅ Auto-detected your name:</strong> {currentUserName}
                  </Text>
                  <Text fontSize="xs" color="green.600">
                    Your messages will appear on the right with blue bubbles!
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    🔍 Detected from: autofill_information.json or message analysis
                  </Text>
                </VStack>
              </Alert>
            ) : (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <VStack align="start" spacing={1} flex={1}>
                  <Text fontSize="sm">
                    <strong>⚠️ Could not auto-detect your name.</strong>
                  </Text>
                  <Text fontSize="xs" color="orange.600">
                    Please enter your name below to see your messages on the right with blue
                    bubbles.
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    🔍 Tried: autofill_information.json and message frequency analysis
                  </Text>
                </VStack>
              </Alert>
            )}

            <FormControl>
              <FormLabel>
                <HStack>
                  <Icon as={FiUser} />
                  <Text>
                    {currentUserName
                      ? 'Override Detected Name'
                      : 'Your Name (Required for message alignment)'}
                  </Text>
                </HStack>
              </FormLabel>
              <Input
                placeholder={
                  currentUserName
                    ? `Currently: ${currentUserName}`
                    : 'Enter your name exactly as it appears in the messages'
                }
                value={userName}
                onChange={(e) => handleUserNameChange(e.target.value)}
                bg={currentUserName ? 'green.50' : 'yellow.50'}
                borderColor={currentUserName ? 'green.300' : 'yellow.300'}
                _focus={{
                  borderColor: currentUserName ? 'green.500' : 'yellow.500',
                  boxShadow: currentUserName
                    ? '0 0 0 1px var(--chakra-colors-green-500)'
                    : '0 0 0 1px var(--chakra-colors-yellow-500)',
                }}
              />
              <FormHelperText color={currentUserName ? 'green.600' : 'orange.600'}>
                {currentUserName ? (
                  '💡 Auto-detection worked! You can override the detected name if needed.'
                ) : (
                  <VStack align="start" spacing={1}>
                    <Text>💡 Enter your name exactly as it appears in the messages.</Text>
                    <Text fontSize="xs" color="gray.500">
                      🔧 Debug: Check browser console for detection logs, or try refreshing after
                      selecting the messages folder.
                    </Text>
                  </VStack>
                )}
              </FormHelperText>
            </FormControl>

            <Divider />

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
                  <Text>OpenRouter API Key (Optional)</Text>
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
