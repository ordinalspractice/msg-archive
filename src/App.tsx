import { ChakraProvider, Box, Flex } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { FolderPicker } from './components/FolderPicker';
import { ConversationList } from './pages/ConversationList';
import { ConversationView } from './pages/ConversationView';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const { directoryHandle, setDirectoryHandle } = useAppContext();

  if (!directoryHandle) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.50" px={4}>
        <Box maxW="md" w="full" bg="white" p={8} borderRadius="xl" boxShadow="lg">
          <FolderPicker onDirectorySelected={setDirectoryHandle} />
        </Box>
      </Flex>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<ConversationList />} />
      <Route path="/conversation/:threadId" element={<ConversationView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ChakraProvider>
      <ErrorBoundary>
        <AppProvider>
          <Router>
            <Box minH="100vh" bg="gray.50" w="100vw" overflow="hidden">
              <AppContent />
            </Box>
          </Router>
        </AppProvider>
      </ErrorBoundary>
    </ChakraProvider>
  );
}

export default App;
