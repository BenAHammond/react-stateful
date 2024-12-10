# @bhammond/react-stateful

A lightweight React hook for syncing URL search parameters with state, built specifically for Next.js and other SSR frameworks. Zero dependencies, pure React, and seamless handling of both client and server-side rendering while maintaining URL state across page loads and navigation.

## Features

- ⚛️ First-class Next.js App Router support
- 🔄 Full SSR compatibility with zero hydration issues
- 🌐 Works with `searchParams` prop and `useSearchParams` hook
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

## Types

### ParamsInput
The hook accepts two types of parameters:

```typescript
// 1. URL-like parameters (e.g., URLSearchParams)
interface URLParamsLike {
  get(key: string): string | null;
}

// 2. Record-like parameters (e.g., Next.js searchParams)
interface RecordParams {
  [key: string]: string | string[] | undefined;
}

// Combined type
type ParamsInput = URLParamsLike | RecordParams;
```

## Basic Usage

### React with URLSearchParams

```typescript
import { useQueryState, type URLParamsLike } from '@bhammond/react-stateful';

function SearchComponent() {
  // URLSearchParams implements URLParamsLike
  const params = new URLSearchParams(window.location.search);
  const [query, setQuery] = useQueryState('q', params);

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
import { type RecordParams } from '@bhammond/react-stateful';

export default async function Page({
  searchParams,
}: {
  searchParams: RecordParams;
}) {
  // Important: In Next.js 15+, you must await params
  const params = await Promise.resolve(searchParams);
  
  return <SearchComponent params={params} />;
}

// app/search-component.tsx
'use client';

import { useQueryState, type RecordParams } from '@bhammond/react-stateful';

export default function SearchComponent({ 
  params 
}: { 
  params: RecordParams
}) {
  const [query, setQuery] = useQueryState('q', params);

  return (
    <input
      value={query ?? ''}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### Using useSearchParams (Client Components)

```typescript
'use client';

import { useSearchParams } from 'next/navigation';
import { useQueryState, type URLParamsLike } from '@bhammond/react-stateful';

export default function SearchComponent() {
  const searchParams = useSearchParams();
  // Important: In Next.js 15+, you must await params
  const params = await Promise.resolve(searchParams);
  const [query, setQuery] = useQueryState('q', params);

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
  params: ParamsInput,
  defaultValue?: T
): [T, (newValue: T | ((prev: T) => T)) => void]
```

#### Parameters

- `name: string` - URL parameter key
- `params: ParamsInput` - Either:
  - `URLParamsLike`: An object with a `get(key: string): string | null` method
  - `RecordParams`: An object with string or string array values
- `defaultValue?: T` - Optional default value when parameter is not present

#### Returns

- `[value, setValue]` - A tuple containing the current value and setter function

#### Type Parameters

- `T` - The type of the state value (defaults to string)

## Advanced Examples

### Form with Default Value

```typescript
function SearchForm({ params }: { params: ParamsInput }) {
  const [query, setQuery] = useQueryState('q', params, '');
  
  return (
    <form onSubmit={e => e.preventDefault()}>
      <input
        value={query}
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

function FilterPanel({ params }: { params: ParamsInput }) {
  const [filters, setFilters] = useQueryState<Filters>('filters', params, DEFAULT_FILTERS);

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

### State Sharing Between Components

```typescript
function SearchInput({ params }: { params: ParamsInput }) {
  const [query, setQuery] = useQueryState('q', params);
  return <input value={query ?? ''} onChange={e => setQuery(e.target.value)} />;
}

function SearchResults({ params }: { params: ParamsInput }) {
  const [query] = useQueryState('q', params);
  return <div>Results for: {query}</div>;
}

function SearchPage({ params }: { params: ParamsInput }) {
  return (
    <div>
      <SearchInput params={params} />
      <SearchResults params={params} />
    </div>
  );
}
```

## Browser Support

- Modern browsers with URLSearchParams and History API support
- No IE11 support

## TypeScript Support

Built with TypeScript and includes type definitions out of the box. Supports strict mode and provides full type inference for state values.

## Performance

- Tiny bundle size
- Efficient URL updates batched with RAF
- Shared state management without additional re-renders
- Zero dependencies

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT