# @bhammond/react-stateful

A lightweight React hook for syncing URL search parameters with state, built for modern React applications. Zero dependencies, pure React, and seamless handling of both client and server-side rendering while maintaining URL state across page loads and navigation.

## Features

- 🔄 Full SSR compatibility with zero hydration issues
- ⚛️ Framework-agnostic with first-class Next.js support
- 🌐 Works with any URLSearchParams-like interface
- 🤝 Shares state between components using the same key
- 🧭 Handles browser navigation (back/forward) automatically
- 📦 TypeScript support out of the box
- ⚡️ Zero dependencies - just React
- 🪶 Tiny bundle size (~1KB minified + gzipped)

## Installation

```bash
npm install @bhammond/react-stateful
```

or

```bash
yarn add @bhammond/react-stateful
```

## Basic Usage

### React with URLSearchParams

```typescript
import { useQueryState } from '@bhammond/react-stateful';

function SearchComponent() {
  // Use the built-in URLSearchParams
  const searchParams = new URLSearchParams(window.location.search);
  const [query, setQuery] = useQueryState('q', searchParams);

  return (
    <input
      value={query ?? ''}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### Next.js App Router

```typescript
// app/page.tsx
import { SearchParams } from 'next/navigation';
import SearchComponent from './search-component';

export default async function Page({
  searchParams
}: {
  searchParams: SearchParams
}) {
  return <SearchComponent searchParams={searchParams} />;
}

// app/search-component.tsx
'use client';

import { useQueryState } from '@bhammond/react-stateful';

export default function SearchComponent({ searchParams }) {
  const [query, setQuery] = useQueryState('q', searchParams);

  return (
    <input
      value={query ?? ''}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### Using useSearchParams Hook (Next.js)

```typescript
'use client';

import { useSearchParams } from 'next/navigation';
import { useQueryState } from '@bhammond/react-stateful';

export default function SearchComponent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useQueryState('q', searchParams);

  return (
    <input
      value={query ?? ''}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

## API Reference

### useQueryState

```typescript
function useQueryState<T = string>(
  name: string,
  searchParams: SearchParamsInput,
  defaultValue?: T
): [T, (newValue: T | ((prev: T) => T)) => void]
```

#### Parameters

- `name: string` - URL parameter key
- `searchParams` - Any object that either:
  - Implements `get(key: string): string | null` (like URLSearchParams)
  - Is a plain object with string values
- `defaultValue?: T` - Optional default value when parameter is not present

#### Returns

- `[value, setValue]` - A tuple containing the current value and setter function

#### Type Parameters

- `T` - The type of the state value (defaults to string)

## Advanced Examples

### With Default Value

```typescript
function SearchForm({ searchParams }) {
  const [query, setQuery] = useQueryState('q', searchParams, '');
  
  return (
    <form onSubmit={e => e.preventDefault()}>
      <input
        value={query}  // No need to check for null
        onChange={e => setQuery(e.target.value)}
        placeholder="Search..."
      />
      <button onClick={() => setQuery('')}>Clear</button>
    </form>
  );
}
```

### Complex Objects

```typescript
interface Filters {
  search: string;
  category: string;
  sortBy: string;
  page: number;
}

const DEFAULT_FILTERS: Filters = {
  search: '',
  category: 'all',
  sortBy: 'date',
  page: 1
};

function FilterPanel({ searchParams }) {
  const [filters, setFilters] = useQueryState<Filters>(
    'filters',
    searchParams,
    DEFAULT_FILTERS
  );

  const updateFilter = (key: keyof Filters, value: Filters[keyof Filters]) => {
    setFilters(current => ({
      ...current,
      [key]: value,
      page: key === 'page' ? value : 1 // Reset page when other filters change
    }));
  };

  return (
    <div>
      <input
        value={filters.search}
        onChange={e => updateFilter('search', e.target.value)}
      />
      <select
        value={filters.category}
        onChange={e => updateFilter('category', e.target.value)}
      >
        {/* options */}
      </select>
    </div>
  );
}
```

### Sharing State Between Components

```typescript
function SearchInput({ searchParams }) {
  const [query, setQuery] = useQueryState('q', searchParams);
  return <input value={query ?? ''} onChange={e => setQuery(e.target.value)} />;
}

function SearchResults({ searchParams }) {
  const [query] = useQueryState('q', searchParams);
  return <div>Results for: {query}</div>;
}

function SearchPage({ searchParams }) {
  return (
    <div>
      <SearchInput searchParams={searchParams} />
      <SearchResults searchParams={searchParams} />
    </div>
  );
}
```

## Browser Support

- Modern browsers that support URLSearchParams and History API
- No IE11 support

## License

MIT