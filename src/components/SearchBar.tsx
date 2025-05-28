import React, { useState } from 'react';
import {
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { FiSearch, FiCalendar } from 'react-icons/fi';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onToggleTimeline: () => void;
  showTimeline: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onToggleTimeline,
  showTimeline,
}) => {
  const [query, setQuery] = useState('');

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  return (
    <HStack spacing={3} w="full">
      <InputGroup flex={1} maxW="md">
        <InputLeftElement pointerEvents="none">
          <Icon as={FiSearch} color="gray.400" />
        </InputLeftElement>
        <Input
          placeholder="Search messages..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          bg="gray.50"
          border="none"
          borderRadius="full"
          _focus={{ bg: "white", boxShadow: "outline" }}
          _placeholder={{ color: "gray.500" }}
        />
      </InputGroup>

      <Tooltip label={showTimeline ? 'Hide timeline' : 'Show timeline'}>
        <IconButton
          aria-label="Toggle timeline"
          icon={<Icon as={FiCalendar} />}
          onClick={onToggleTimeline}
          colorScheme={showTimeline ? 'blue' : 'gray'}
          variant={showTimeline ? 'solid' : 'ghost'}
          borderRadius="full"
          size="md"
        />
      </Tooltip>
    </HStack>
  );
};
