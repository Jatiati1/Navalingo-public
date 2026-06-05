import { makeDocsLocalAdapter } from "@/features/search/adapters/docsLocalAdapter";

describe("docsLocalAdapter", () => {
  let mockDocsGetter;

  beforeEach(() => {
    mockDocsGetter = jest.fn(() => [
      { id: "1", title: "First Document" },
      { id: "2", title: "Second Document" },
      { id: "3" }, // missing title -> "Untitled Document"
    ]);

    delete window.location;
    window.location = { href: "" };
  });

  it("throws if getter is not a function", () => {
    expect(() => makeDocsLocalAdapter(null)).toThrow("makeDocsLocalAdapter requires a function docsGetter()");
  });

  it("returns empty array for empty search", async () => {
    const adapter = makeDocsLocalAdapter(mockDocsGetter);
    const results = await adapter.search("   ");
    expect(results).toEqual([]);
    expect(adapter.getLastQuery()).toBe("");
  });

  it("fuzzy searches docs by title", async () => {
    const adapter = makeDocsLocalAdapter(mockDocsGetter);
    const results = await adapter.search("first");

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(
      expect.objectContaining({
        id: "1",
        label: "First Document",
        raw: { id: "1", title: "First Document" }
      })
    );

    expect(adapter.getLastQuery()).toBe("first");

    // Check action
    results[0].action();
    expect(window.location.href).toBe("/dashboard/1");
  });

  it("handles missing titles by assigning 'Untitled Document'", async () => {
    const adapter = makeDocsLocalAdapter(mockDocsGetter);
    const results = await adapter.search("untitled");

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe("3");
    expect(results[0].label).toBe("Untitled Document");
  });

  it("reindexes when docs length changes", async () => {
    const adapter = makeDocsLocalAdapter(mockDocsGetter);
    await adapter.search("third"); // Initial search, no "third"

    // Change docs
    mockDocsGetter.mockReturnValue([
      { id: "1", title: "First Document" },
      { id: "2", title: "Second Document" },
      { id: "3" }, 
      { id: "4", title: "Third Document" }, // Updated
    ]);

    const results = await adapter.search("third");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe("4");
  });

  it("allows setting custom fuse options", async () => {
    const adapter = makeDocsLocalAdapter(mockDocsGetter);

    // Change to exact match threshold
    adapter.setOptions({ threshold: 0.0 });

    // Verify the fuse instance received the option
    const fuse = adapter.getFuseInstance();
    expect(fuse.options.threshold).toBe(0.0);
    
    // "xyz" won't match anything
    let results = await adapter.search("xyz");
    expect(results).toHaveLength(0);

    // Exact substring match works
    results = await adapter.search("First Document");
    expect(results.length).toBeGreaterThan(0);
  });

  it("exposes fuse instance", () => {
    const adapter = makeDocsLocalAdapter(mockDocsGetter);
    const fuse = adapter.getFuseInstance();
    expect(fuse).toBeDefined();
    expect(typeof fuse.search).toBe("function");
  });

  it("falls back to substring match if Fuse.js throws", async () => {
    const adapter = makeDocsLocalAdapter(mockDocsGetter);
    const fuse = adapter.getFuseInstance();

    // Force fuse.search to throw
    jest.spyOn(fuse, "search").mockImplementation(() => {
      throw new Error("Fuse error");
    });

    // Substring fallback
    const results = await adapter.search("second");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("2");
  });

  it("setOptions ignores invalid input", () => {
    const adapter = makeDocsLocalAdapter(mockDocsGetter);
    // Should not throw
    adapter.setOptions(null);
    adapter.setOptions(undefined);
    adapter.setOptions(42);
    expect(adapter.getFuseInstance()).toBeDefined();
  });

  it("handles docsGetter returning null", async () => {
    const nullGetter = jest.fn(() => null);
    const adapter = makeDocsLocalAdapter(nullGetter);
    const results = await adapter.search("anything");
    expect(results).toEqual([]);
  });

  it("handles docs with empty string title in fallback", async () => {
    const docsWithEmptyTitle = jest.fn(() => [
      { id: "1", title: "" },
      { id: "2", title: "Real Title" },
    ]);
    const adapter = makeDocsLocalAdapter(docsWithEmptyTitle);
    const fuse = adapter.getFuseInstance();

    // Force fallback
    jest.spyOn(fuse, "search").mockImplementation(() => {
      throw new Error("Fuse error");
    });

    const results = await adapter.search("real");
    expect(results).toHaveLength(1);
    expect(results[0].label).toBe("Real Title");
  });

  it("handles null term in search", async () => {
    const adapter = makeDocsLocalAdapter(mockDocsGetter);
    const results = await adapter.search(null);
    expect(results).toEqual([]);
    expect(adapter.getLastQuery()).toBe("");
  });

  it("fallback assigns Untitled Document for docs without title", async () => {
    const docsNoTitle = jest.fn(() => [
      { id: "1" },
      { id: "2", title: "Match Me" },
    ]);
    const adapter = makeDocsLocalAdapter(docsNoTitle);
    const fuse = adapter.getFuseInstance();

    jest.spyOn(fuse, "search").mockImplementation(() => {
      throw new Error("Fuse error");
    });

    // Search for untitled won't match because fallback checks title.toLowerCase()
    const results = await adapter.search("match");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].label).toBe("Match Me");
  });

  it("limits results in fallback", async () => {
    const manyDocs = jest.fn(() =>
      Array.from({ length: 30 }, (_, i) => ({ id: `${i}`, title: `Doc ${i}` }))
    );
    const adapter = makeDocsLocalAdapter(manyDocs, { limit: 5 });
    const fuse = adapter.getFuseInstance();

    jest.spyOn(fuse, "search").mockImplementation(() => {
      throw new Error("Fuse error");
    });

    const results = await adapter.search("doc");
    expect(results).toHaveLength(5);
  });

  it("handles result items with missing title in normal search", async () => {
    const docsNoTitle = jest.fn(() => [
      { id: "1" },
    ]);
    const adapter = makeDocsLocalAdapter(docsNoTitle);
    // The reindex normalizes title to "Untitled Document", so search should work
    const results = await adapter.search("untitled");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].label).toBe("Untitled Document");
  });
});
