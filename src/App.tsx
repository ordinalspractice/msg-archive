import React from 'react';
import { ChakraProvider, Box, Container } from '@chakra-ui/react';
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
      <Container maxW="container.lg" py={10}>
        <FolderPicker onDirectorySelected={setDirectoryHandle} />
      </Container>
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
            <Box minH="100vh" bg="gray.50">
              <AppContent />
            </Box>
          </Router>
        </AppProvider>
      </ErrorBoundary>
    </ChakraProvider>
  );
}

export default App;
