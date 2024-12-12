# @bhammond/react-stateful

Framework-agnostic URL-synchronized state management with built-in state sharing between components. Uses signals under the hood to efficiently share state without unnecessary re-renders.

Looking for Next.js integration? Check out [react-stateful-next](https://github.com/yourusername/react-stateful-next)

## Features

- ⚡️ Lightning-fast state sharing between components using signals
- 🔄 Automatic URL synchronization with component state
- 🌐 Works with any params object implementing `get(key)` method
- 🧭 Handles browser navigation automatically
- 🤝 Framework agnostic
- 📦 TypeScript support out of the box
- 🪶 Tiny bundle size (~1KB minified + gzipped)
- 💪 Zero dependencies

## Installation

```bash
npm install @bhammond/react-stateful
```

### Requirements

- React 16.8+

## Basic Usage

```typescript
import { useQueryState } from '@bhammond/react-stateful';

function SearchComponent() {
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

## State Sharing Between Components

One of the key features of react-stateful is efficient state sharing between components using signals. Components using the same key will automatically share state without unnecessary re-renders:

```typescript
import { useQueryState } from '@bhammond/react-stateful';

// These components will share state automatically
function SearchInput({ params }) {
  const [query, setQuery] = useQueryState('q', params);
  return <input value={query ?? ''} onChange={e => setQuery(e.target.value)} />;
}

function SearchResults({ params }) {
  // Uses the same signal as SearchInput - no prop drilling needed
  const [query] = useQueryState('q', params);
  return <div>Results for: {query}</div>;
}

function FilterStatus({ params }) {
  // Will update in sync with other components
  const [query] = useQueryState('q', params);
  return <div>Current filter: {query || 'None'}</div>;
}

// Use them anywhere in your app - they'll stay in sync
function SearchPage() {
  const params = new URLSearchParams(window.location.search);
  return (
    <div>
      <SearchInput params={params} />
      <FilterStatus params={params} />
      <SearchResults params={params} />
    </div>
  );
}
```

## Complex Objects

The hook handles complex objects automatically, maintaining type safety:

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

function FilterPanel({ params }) {
  // Type-safe and shared between components
  const [filters, setFilters] = useQueryState<Filters>('filters', params, DEFAULT_FILTERS);

  const updateFilter = (key: keyof Filters, value: Filters[keyof Filters]) => {
    setFilters(current => ({
      ...current,
      [key]: value,
      page: key === 'page' ? value : 1
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

## How It Works

1. When a component calls `useQueryState` with a key, it either creates a new signal or subscribes to an existing one
2. Updates to the state are automatically synchronized with the URL
3. Multiple components using the same key share the same signal, ensuring efficient updates
4. Browser navigation (back/forward) is handled automatically
5. Changes are batched and debounced for optimal performance

## Framework Integration

### React Router

```typescript
import { useSearchParams } from 'react-router-dom';
import { useQueryState } from '@bhammond/react-stateful';

function SearchComponent() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useQueryState('q', searchParams);

  return (
    <input
      value={query ?? ''}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}
```

### Generic Usage

```typescript
class CustomParams implements URLParamsLike {
  private params: Map<string, string>;

  constructor() {
    this.params = new Map();
  }

  get(key: string): string | null {
    return this.params.get(key) ?? null;
  }

  set(key: string, value: string): void {
    this.params.set(key, value);
  }
}

function Component() {
  const params = new CustomParams();
  const [value, setValue] = useQueryState('key', params);
  // ...
}
```

## TypeScript Support

Built with TypeScript and includes type definitions out of the box. Supports strict mode and provides full type inference for state values.

## Performance

- Uses signals for efficient state sharing
- Minimal re-renders - only affected components update
- URL updates are batched and debounced
- Tiny bundle size with zero dependencies

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT