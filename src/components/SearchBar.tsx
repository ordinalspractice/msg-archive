import React, { useState } from 'react';
import {
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Icon,
  Tooltip,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiSearch, FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onToggleTimeline: () => void;
  showTimeline: boolean;
  searchResultCount: number;
  currentResultIndex: number; // 1-based for display
  onNavigateNext: () => void;
  onNavigatePrev: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onToggleTimeline,
  showTimeline,
  searchResultCount,
  currentResultIndex,
  onNavigateNext,
  onNavigatePrev,
}) => {
  const [query, setQuery] = useState('');

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && searchResultCount > 0) {
      event.preventDefault(); // Prevent form submission if any
      onNavigateNext();
    }
  };

  return (
    <VStack spacing={2} w="full" align="stretch">
      <HStack spacing={3} w="full">
        <InputGroup flex={1} maxW="md">
          <InputLeftElement pointerEvents="none">
            <Icon as={FiSearch} color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search messages..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            bg="gray.50"
            border="none"
            borderRadius="full"
            _focus={{ bg: "white", boxShadow: "outline" }}
            _placeholder={{ color: "gray.500" }}
          />
        </InputGroup>

        {/* Search navigation buttons */}
        {query && (
          <HStack spacing={1}>
            <Tooltip label="Previous result">
              <IconButton
                aria-label="Previous result"
                icon={<Icon as={FiChevronLeft} />}
                onClick={onNavigatePrev}
                isDisabled={searchResultCount === 0}
                size="sm"
                variant="ghost"
                borderRadius="full"
              />
            </Tooltip>
            <Tooltip label="Next result">
              <IconButton
                aria-label="Next result"
                icon={<Icon as={FiChevronRight} />}
                onClick={onNavigateNext}
                isDisabled={searchResultCount === 0}
                size="sm"
                variant="ghost"
                borderRadius="full"
              />
            </Tooltip>
          </HStack>
        )}

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

      {/* Search result count */}
      {query && (
        <HStack justify="start" pl={2}>
          <Text fontSize="sm" color="gray.600">
            {searchResultCount === 0 
              ? 'No results found' 
              : searchResultCount === 1 
                ? '1 result found'
                : currentResultIndex > 0 
                  ? `Result ${currentResultIndex} of ${searchResultCount}`
                  : `${searchResultCount} results found`
            }
          </Text>
        </HStack>
      )}
    </VStack>
  );
};
