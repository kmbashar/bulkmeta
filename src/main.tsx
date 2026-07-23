import React from "react";
import { createRoot } from "react-dom/client";
import {
  AlertCircle,
  Check,
  CheckSquare,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileUp,
  Image,
  Images,
  LoaderCircle,
  Moon,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Sun,
  X,
} from "lucide-react";
import "./styles.css";

type WebflowAssetRef = {
  id: string;
  getName?: () => Promise<string>;
  getUrl?: () => Promise<string>;
  getMimeType?: () => Promise<string>;
};

type WebflowPageRef = {
  id?: string;
  type: string;
  getName?: () => Promise<string>;
  getKind?: () => Promise<"static" | "ecommerce" | "cms" | "userSystems" | "utility" | "staticTemplate">;
  getParent?: () => Promise<null | WebflowPageRef>;
  getParentPageId?: () => Promise<string | null>;
  getSlug?: () => Promise<string>;
  getPublishPath?: () => Promise<string>;
  setMetadata?: (metadata: Partial<WebflowPageMetadata>) => Promise<null>;
  getTitle?: () => Promise<string>;
  setTitle?: (title: string | null) => Promise<null>;
  getDescription?: () => Promise<string>;
  setDescription?: (description: string | null) => Promise<null>;
  getSearchTitle?: () => Promise<string | null>;
  setSearchTitle?: (title: string | null) => Promise<null>;
  getSearchDescription?: () => Promise<string | null>;
  setSearchDescription?: (description: string | null) => Promise<null>;
  isExcludedFromSearch?: () => Promise<boolean>;
  usesTitleAsSearchTitle?: () => Promise<boolean>;
  useTitleAsSearchTitle?: (use: boolean) => Promise<null>;
  usesDescriptionAsSearchDescription?: () => Promise<boolean>;
  useDescriptionAsSearchDescription?: (use: boolean) => Promise<null>;
  getOpenGraphTitle?: () => Promise<string | null>;
  setOpenGraphTitle?: (title: string | null) => Promise<null>;
  getOpenGraphDescription?: () => Promise<string | null>;
  setOpenGraphDescription?: (description: string | null) => Promise<null>;
  getOpenGraphImage?: () => Promise<string | null>;
  setOpenGraphImage?: (url: string | null) => Promise<null>;
  usesTitleAsOpenGraphTitle?: () => Promise<boolean>;
  useTitleAsOpenGraphTitle?: (use: boolean) => Promise<null>;
  usesDescriptionAsOpenGraphDescription?: () => Promise<boolean>;
  useDescriptionAsOpenGraphDescription?: (use: boolean) => Promise<null>;
};

type WebflowPageMetadata = {
  title: string;
  description: string;
  usesTitleAsSearchTitle: boolean;
  searchTitle: string;
  usesDescriptionAsSearchDescription: boolean;
  searchDescription: string;
  usesTitleAsOpenGraphTitle: boolean;
  openGraphTitle: string;
  usesDescriptionAsOpenGraphDescription: boolean;
  openGraphDescription: string;
  openGraphImage: string;
};

type WebflowDesignerApi = {
  getAllPagesAndFolders?: () => Promise<WebflowPageRef[]>;
  getAllAssets?: () => Promise<WebflowAssetRef[]>;
  subscribe?: (event: "currentpage", callback: (page: WebflowPageRef) => void) => () => void;
  notify?: (options: {
    type: "Success" | "Error" | "Info" | "Warning";
    message: string;
    dismissAfter?: number;
  }) => Promise<void | null>;
  setExtensionSize?: (
    size: "default" | "compact" | "comfortable" | "large" | { width: number; height: number },
  ) => Promise<null>;
};

declare global {
  interface Window {
    webflow?: WebflowDesignerApi;
  }
}

type SeoPage = {
  id: string;
  name: string;
  slug: string;
  url: string;
  groupLabel: string;
  seoTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  useSeoForOg: boolean;
};

type ToastState = {
  message: string;
  tone: "success" | "error";
};

type SaveReport = {
  success: string[];
  failed: Array<{ id: string; name: string; message: string }>;
  skipped: Array<{ id: string; name: string; message: string }>;
};

type CsvPagePatch = {
  id: string;
  patch: Partial<SeoPage>;
};

type CsvImportResult = {
  rows: CsvPagePatch[];
  invalidRows: string[];
  skippedRows: string[];
};

type LoadedPage = SeoPage & {
  parentId: string | null;
  sourceIndex: number;
};

type SidebarRow =
  | { type: "group"; id: string; label: string }
  | { type: "page"; page: SeoPage };

type AssetItem = {
  id: string;
  name: string;
  url: string;
  mimeType: string;
};

type ThemeChoice = "light" | "dark";
type SortChoice = "grouped" | "seo-status" | "az" | "za";

type LoadOptions = {
  silent?: boolean;
};

const SAVE_TIMEOUT_MS = 15000;

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { message: string | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { message: null };
  }

  static getDerivedStateFromError(error: unknown) {
    return { message: error instanceof Error ? error.message : "The app could not render." };
  }

  render() {
    if (!this.state.message) return this.props.children;
    return (
      <div className="fatal-error">
        <AlertCircle size={28} />
        <h1>BulkMeta could not start</h1>
        <p>{this.state.message}</p>
      </div>
    );
  }
}

function App() {
  const [pages, setPages] = React.useState<SeoPage[]>([]);
  const [pageRefs, setPageRefs] = React.useState<Record<string, WebflowPageRef>>({});
  const [assets, setAssets] = React.useState<AssetItem[]>([]);
  const [selectedPageId, setSelectedPageId] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [query, setQuery] = React.useState("");
  const [mode, setMode] = React.useState<"single" | "bulk">("single");
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [assetPickerTarget, setAssetPickerTarget] = React.useState<"single" | "bulk" | null>(null);
  const [assetQuery, setAssetQuery] = React.useState("");
  const [bulkTitle, setBulkTitle] = React.useState("{page} - SEO Title");
  const [bulkDescription, setBulkDescription] = React.useState(
    "Write one helpful description here. It will be applied to every selected page.",
  );
  const [bulkOgImage, setBulkOgImage] = React.useState("");
  const [syncOg, setSyncOg] = React.useState(true);
  const [bulkSections, setBulkSections] = React.useState<string[]>([]);
  const importInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [toast, setToast] = React.useState<ToastState | null>(null);
  const [saveReport, setSaveReport] = React.useState<SaveReport | null>(null);
  const [theme, setTheme] = React.useState<ThemeChoice>(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  );
  const [pageSort, setPageSort] = React.useState<SortChoice>("seo-status");

  const selectedPage = pages.find((page) => page.id === selectedPageId) ?? pages[0];
  const sortedPages = sortPagesForSidebar(pages, pageSort);
  const visiblePages = sortedPages.filter((page) => page.name.toLowerCase().includes(query.trim().toLowerCase()));
  const visibleMissingTitlePages = visiblePages.filter(isMissingSeoTitle);
  const visibleMissingDescriptionPages = visiblePages.filter(isMissingMetaDescription);
  const visibleMissingSeoPages = visiblePages.filter(isMissingSeoCopy);
  const sidebarRows = pageSort === "seo-status" ? buildSeoStatusRows(visiblePages) : buildSidebarRows(visiblePages, query);
  const selectedPages = pages.filter((page) => selectedIds.includes(page.id));
  const selectedPagesHaveInvalidOgImage = selectedPages.some((page) => !validateImageUrl(page.ogImage).valid);
  const selectedPageHasInvalidOgImage = selectedPage ? !validateImageUrl(selectedPage.ogImage).valid : false;
  const bulkOgImageIsInvalid = !validateImageUrl(bulkOgImage).valid;
  const visibleAssets = assets.filter((asset) => {
    const text = `${asset.name} ${asset.mimeType}`.toLowerCase();
    return asset.mimeType.startsWith("image/") && text.includes(assetQuery.trim().toLowerCase());
  });

  React.useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  React.useEffect(() => {
    void loadWebflowData();
  }, []);

  React.useEffect(() => {
    if (!isConnected) return;

    const unsubscribeCurrentPage = window.webflow?.subscribe?.("currentpage", () => {
      if (isSaving || document.visibilityState !== "visible") return;
      window.setTimeout(() => {
        void loadWebflowData({ silent: true });
      }, 800);
    });

    return () => {
      unsubscribeCurrentPage?.();
    };
  }, [isConnected, isSaving]);

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  async function loadWebflowData(options: LoadOptions = {}) {
    if (!window.webflow?.getAllPagesAndFolders) {
      setIsConnected(false);
      if (!options.silent) setIsLoading(false);
      return;
    }

    if (!options.silent) setIsLoading(true);
    try {
      await window.webflow.setExtensionSize?.("large");
      const items = await window.webflow.getAllPagesAndFolders();
      const refs: Record<string, WebflowPageRef> = {};
      const folderNames = new Map<string, string>();
      await Promise.all(
        items.map(async (item) => {
          if (item.type !== "PageFolder" || !item.id) return;
          folderNames.set(item.id, (await item.getName?.()) ?? "Folder");
        }),
      );
      const loadedPages = await Promise.all(
        items
          .map(async (page, index) => {
            if (page.type !== "Page") return null;
            const kind = await page.getKind?.();
            if (kind === "staticTemplate") return null;
            const name = (await page.getName?.()) ?? `Page ${index + 1}`;
            const slug = (await page.getSlug?.()) ?? "";
            const url = (await page.getPublishPath?.()) ?? slug;
            const id = page.id ?? `${name}-${slug}-${index}`;
            const parentId = (await page.getParentPageId?.()) ?? (await page.getParent?.())?.id ?? null;
            const pageTitle = (await page.getTitle?.()) ?? "";
            const pageDescription = (await page.getDescription?.()) ?? "";
            const usesSearchTitle = (await page.usesTitleAsSearchTitle?.()) ?? true;
            const usesSearchDescription = (await page.usesDescriptionAsSearchDescription?.()) ?? true;
            const searchTitle = usesSearchTitle ? pageTitle : (await page.getSearchTitle?.()) || pageTitle;
            const searchDescription = usesSearchDescription
              ? pageDescription
              : (await page.getSearchDescription?.()) || pageDescription;
            const usesOgTitle = (await page.usesTitleAsOpenGraphTitle?.()) ?? true;
            const usesOgDescription = (await page.usesDescriptionAsOpenGraphDescription?.()) ?? true;
            refs[id] = page;
            return {
              id,
              name,
              slug,
              url,
              groupLabel: getPageGroupLabel(parentId, kind, folderNames),
              parentId,
              sourceIndex: index,
              seoTitle: searchTitle,
              metaDescription: searchDescription,
              ogTitle: usesOgTitle ? searchTitle : (await page.getOpenGraphTitle?.()) || searchTitle,
              ogDescription: usesOgDescription ? searchDescription : (await page.getOpenGraphDescription?.()) || searchDescription,
              ogImage: (await page.getOpenGraphImage?.()) ?? "",
              useSeoForOg: usesOgTitle && usesOgDescription,
            };
          }),
      );
      const visibleLoadedPages = orderPagesLikeWebflow(
        items,
        loadedPages.filter((page): page is LoadedPage => Boolean(page)),
      );
      const orderedLoadedPages = sortPagesByWebflowSection(visibleLoadedPages);

      const loadedAssets = await loadAssets();
      const previousSignature = pageListSignature(pages);
      const nextSignature = pageListSignature(orderedLoadedPages);
      const newPageCount = countNewPages(pages, orderedLoadedPages);
      setPageRefs(refs);
      if (!options.silent || previousSignature !== nextSignature) setPages(orderedLoadedPages);
      setAssets(loadedAssets.length ? loadedAssets : []);
      setSelectedIds((current) => reconcileSelectedIds(current, orderedLoadedPages));
      setSelectedPageId((current) =>
        orderedLoadedPages.some((page) => page.id === current) ? current : orderedLoadedPages[0]?.id ?? "",
      );
      setIsConnected(true);
      if (!options.silent) {
        showToast(`${orderedLoadedPages.length} pages loaded from Webflow.`);
      } else if (newPageCount > 0) {
        showToast(`${newPageCount} new page${newPageCount === 1 ? "" : "s"} added from Webflow.`);
      }
    } catch (error) {
      if (!options.silent) showToast(error instanceof Error ? error.message : "Could not load Webflow data.", "error");
    } finally {
      if (!options.silent) setIsLoading(false);
    }
  }

  async function loadAssets() {
    if (!window.webflow?.getAllAssets) return [];
    const allAssets = await window.webflow.getAllAssets();
    const rows = await Promise.all(
      allAssets.map(async (asset) => ({
        id: asset.id,
        name: (await asset.getName?.()) ?? "Untitled asset",
        url: (await asset.getUrl?.()) ?? "",
        mimeType: (await asset.getMimeType?.()) ?? "",
      })),
    );
    return rows.filter((asset) => asset.url && asset.mimeType.startsWith("image/"));
  }

  function patchPage(id: string, patch: Partial<SeoPage>) {
    setPages((current) => current.map((page) => (page.id === id ? { ...page, ...patch } : page)));
  }

  function applyBulkPreview() {
    setPages((current) => current.map((page) => (selectedIds.includes(page.id) ? buildBulkPage(page) : page)));
    showToast(`Bulk details prepared for ${selectedPages.length} page${selectedPages.length === 1 ? "" : "s"}.`);
  }

  function buildBulkPage(page: SeoPage) {
    const seoTitle = renderTemplate(bulkTitle, page);
    const patch: Partial<SeoPage> = {
      seoTitle,
      metaDescription: bulkDescription,
    };
    if (syncOg) {
      patch.ogTitle = seoTitle;
      patch.ogDescription = bulkDescription;
      patch.useSeoForOg = true;
    }
    if (bulkOgImage) patch.ogImage = normalizeImageUrl(bulkOgImage);
    return { ...page, ...patch };
  }

  async function saveBulkPages() {
    if (bulkOgImage) {
      const validation = validateImageUrl(bulkOgImage);
      if (!validation.valid) {
        showToast(validation.error ?? "Use a valid HTTPS image URL for the OG image.", "error");
        return;
      }
    }
    const nextPages = pages.map((page) => (selectedIds.includes(page.id) ? buildBulkPage(page) : page));
    const pageMap = new Map(nextPages.map((page) => [page.id, page]));
    await savePages(selectedIds, pageMap);
  }

  async function savePages(ids: string[], overrides?: Map<string, SeoPage>) {
    if (!isConnected) {
      showToast("Open this app through Webflow Designer to save page settings.", "error");
      return;
    }

    const targetIds = Array.from(new Set(ids));
    const targetPages = pages
      .filter((item) => targetIds.includes(item.id))
      .map((page) => overrides?.get(page.id) ?? page);
    const invalidPage = targetPages.find((page) => !validateImageUrl(page.ogImage).valid);
    if (invalidPage) {
      const validation = validateImageUrl(invalidPage.ogImage);
      showToast(invalidPage.name + ": " + (validation.error ?? "Invalid Open Graph image URL."), "error");
      return;
    }

    setIsSaving(true);
    setSaveReport(null);
    const report: SaveReport = { success: [], failed: [], skipped: [] };
    try {
      for (const page of targetPages) {
        const ref = pageRefs[page.id];
        if (!ref) {
          report.skipped.push({ id: page.id, name: page.name, message: "Page reference was not available." });
          continue;
        }
        try {
          await savePageSafely(ref, page);
          report.success.push(page.id);
        } catch (error) {
          report.failed.push({
            id: page.id,
            name: page.name,
            message: error instanceof Error ? error.message : "Could not save page settings.",
          });
        }
      }
      const failedCount = report.failed.length;
      const skippedCount = report.skipped.length;
      const message = buildSaveSummary(report);
      if (overrides && report.success.length) {
        const savedIds = new Set(report.success);
        setPages((current) =>
          current.map((page) => {
            const override = overrides.get(page.id);
            return override && savedIds.has(page.id) ? override : page;
          }),
        );
      }
      setSaveReport(report);
      showToast(message, failedCount || skippedCount ? "error" : "success");
      await window.webflow?.notify?.({ type: failedCount ? "Error" : skippedCount ? "Warning" : "Success", message });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save page settings.";
      showToast(message, "error");
      await window.webflow?.notify?.({ type: "Error", message });
    } finally {
      setIsSaving(false);
    }
  }

  async function savePageSafely(ref: WebflowPageRef, page: SeoPage) {
    const previousMetadata = await readPageMetadata(ref);
    const nextMetadata = buildPageMetadata(page, (await ref.isExcludedFromSearch?.()) ?? false);

    try {
      if (ref.setMetadata) {
        await withTimeout(ref.setMetadata(nextMetadata), SAVE_TIMEOUT_MS, `Saving ${page.name} timed out.`);
      } else {
        await savePageWithIndividualSetters(ref, page, nextMetadata);
      }
    } catch (error) {
      await restorePageMetadata(ref, previousMetadata).catch(() => null);
      throw error;
    }
  }

  function chooseAsset(asset: AssetItem) {
    const validation = validateImageUrl(asset.url);
    if (!validation.valid) {
      showToast(validation.error ?? "Invalid image URL.", "error");
      return;
    }
    const safeUrl = normalizeImageUrl(asset.url);
    if (assetPickerTarget === "single" && selectedPage) {
      patchPage(selectedPage.id, { ogImage: safeUrl });
    }
    if (assetPickerTarget === "bulk") {
      setBulkOgImage(safeUrl);
    }
    setAssetPickerTarget(null);
    setAssetQuery("");
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function selectVisibleMissingSeoPages(targetPages: SeoPage[], label: string) {
    setSelectedIds(targetPages.map((page) => page.id));
    showToast(`${targetPages.length} visible page${targetPages.length === 1 ? "" : "s"} selected for missing ${label}.`);
  }

  function applyQuickSelection(value: string) {
    if (!value) return;
    if (value === "all") {
      setSelectedIds(visiblePages.map((page) => page.id));
      showToast(`${visiblePages.length} visible page${visiblePages.length === 1 ? "" : "s"} selected.`);
      return;
    }
    if (value === "none") {
      setSelectedIds([]);
      showToast("All pages deselected.");
      return;
    }
    if (value === "missing-title") {
      selectVisibleMissingSeoPages(visibleMissingTitlePages, "titles");
      return;
    }
    if (value === "missing-description") {
      selectVisibleMissingSeoPages(visibleMissingDescriptionPages, "descriptions");
      return;
    }
    if (value === "missing-either") {
      selectVisibleMissingSeoPages(visibleMissingSeoPages, "SEO copy");
    }
  }

  function exportCsv() {
    downloadFile("bulkmeta-pages.csv", toCsv(pages));
    showToast("CSV exported.");
  }

  async function importCsv(file: File | null) {
    if (!file) return;
    const parsed = parseCsv(await file.text(), pages);
    if (parsed.invalidRows.length) {
      showToast(`${parsed.invalidRows.length} invalid CSV row${parsed.invalidRows.length === 1 ? "" : "s"} skipped.`, "error");
    }
    if (!parsed.rows.length) {
      showToast("No matching Webflow page IDs found in the CSV.", "error");
      return;
    }
    setPages((current) => {
      const patches = new Map(parsed.rows.map((row) => [row.id, row.patch]));
      return current.map((page) => (patches.has(page.id) ? { ...page, ...patches.get(page.id), id: page.id } : page));
    });
    if (importInputRef.current) importInputRef.current.value = "";
    const skipped = parsed.skippedRows.length ? ` ${parsed.skippedRows.length} unmatched row${parsed.skippedRows.length === 1 ? "" : "s"} skipped.` : "";
    showToast(`${parsed.rows.length} CSV row${parsed.rows.length === 1 ? "" : "s"} imported.${skipped}`);
  }

  function showToast(message: string, tone: ToastState["tone"] = "success") {
    setToast({ message, tone });
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">
            <img src="./bulkseo-free-icon.png" alt="" />
          </span>
          <div>
            <strong>BulkMeta</strong>
            <span>Edit SEO and social previews faster</span>
          </div>
        </div>

        <div className="mode-switch" aria-label="Editing mode">
          <button className={mode === "single" ? "active" : ""} onClick={() => setMode("single")}>
            One page
          </button>
          <button className={mode === "bulk" ? "active" : ""} onClick={() => setMode("bulk")}>
            Bulk
          </button>
        </div>

        <div className="header-actions">
          <ThemeControl theme={theme} onTheme={setTheme} />

          <button className="icon-button header-icon" onClick={() => loadWebflowData()} disabled={isLoading} title="Reload pages" aria-label="Reload pages">
            {isLoading ? <LoaderCircle className="spin" size={16} /> : <RefreshCcw size={16} />}
          </button>

          <div className="csv-actions">
            <button className="icon-button header-icon" onClick={() => importInputRef.current?.click()} title="Import CSV" aria-label="Import CSV">
              <FileUp size={15} />
            </button>
            <button className="icon-button header-icon" onClick={exportCsv} title="Export CSV" aria-label="Export CSV">
              <Download size={15} />
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => importCsv(event.target.files?.[0] ?? null)}
            />
          </div>
        </div>
      </header>

      <main className={sidebarCollapsed ? "workspace sidebar-collapsed" : "workspace"}>
        <aside className="page-panel">
          <div className="sidebar-top">
            {!sidebarCollapsed && (
              <div className="search-wrap">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search page name"
                  aria-label="Search page name"
                />
              </div>
            )}
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarCollapsed((value) => !value)}
              aria-label={sidebarCollapsed ? "Expand page sidebar" : "Collapse page sidebar"}
            >
              {sidebarCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            </button>
          </div>

          {!sidebarCollapsed && (
            <>
              <label className="quick-select-control">
                <CheckSquare size={15} />
                <span>Select pages</span>
                <strong>Choose pages...</strong>
                <select
                  value=""
                  onChange={(event) => {
                    applyQuickSelection(event.target.value);
                    event.currentTarget.value = "";
                  }}
                  aria-label="Select pages by SEO status"
                >
                  <option value="">Choose pages...</option>
                  <option value="all">All visible ({visiblePages.length})</option>
                  <option value="missing-title">Missing title ({visibleMissingTitlePages.length})</option>
                  <option value="missing-description">Missing description ({visibleMissingDescriptionPages.length})</option>
                  <option value="missing-either">Missing title or description ({visibleMissingSeoPages.length})</option>
                  <option value="none">Deselect all</option>
                </select>
              </label>

              <label className="sort-control">
                <SlidersHorizontal size={15} />
                <span>Sort</span>
                <strong>{sortLabel(pageSort)}</strong>
                <select value={pageSort} onChange={(event) => setPageSort(event.target.value as SortChoice)}>
                  <option value="grouped">Grouped</option>
                  <option value="seo-status">SEO status</option>
                  <option value="az">A-Z</option>
                  <option value="za">Z-A</option>
                </select>
              </label>

              <div className="page-list">
                {isLoading && pages.length === 0 && <PageListLoader />}
                {!isLoading &&
                  sidebarRows.map((row) =>
                    row.type === "group" ? (
                      <div key={row.id} className="page-group-label">
                        {row.label}
                      </div>
                    ) : (
                      <button
                        key={row.page.id}
                        className={row.page.id === selectedPageId ? "page-item active" : "page-item"}
                        onClick={() => {
                          setSelectedPageId(row.page.id);
                          setMode("single");
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.page.id)}
                          onChange={(event) => {
                            event.stopPropagation();
                            toggleSelected(row.page.id);
                          }}
                          onClick={(event) => event.stopPropagation()}
                          aria-label={`Select ${row.page.name}`}
                        />
                        <span>
                          <strong>{row.page.name}</strong>
                          <small>{formatSlug(row.page)}</small>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    ),
                  )}
              </div>

            </>
          )}
        </aside>

        <section className="editor-panel">
          {isLoading && pages.length === 0 && <EditorSkeleton />}
          {mode === "single" && selectedPage && (
            <SingleEditor
              page={selectedPage}
              isSaving={isSaving}
              selectedCount={selectedIds.length}
              onPatch={(patch) => patchPage(selectedPage.id, patch)}
              onSave={() => savePages([selectedPage.id])}
              onSaveSelected={() => savePages(selectedIds)}
              onPickAsset={() => setAssetPickerTarget("single")}
              saveDisabled={selectedPageHasInvalidOgImage}
              saveSelectedDisabled={selectedPagesHaveInvalidOgImage}
            />
          )}

          {mode === "bulk" && (
            <BulkEditor
              selectedCount={selectedPages.length}
              title={bulkTitle}
              description={bulkDescription}
              ogImage={bulkOgImage}
              syncOg={syncOg}
              previewPages={selectedPages.slice(0, 4)}
              pages={pages}
              selectedIds={selectedIds}
              isSaving={isSaving}
              saveDisabled={bulkOgImageIsInvalid}
              onTitle={setBulkTitle}
              onDescription={setBulkDescription}
              onOgImage={setBulkOgImage}
              onSyncOg={setSyncOg}
              onTogglePage={toggleSelected}
              onSelectAll={() => setSelectedIds(pages.map((page) => page.id))}
              onSelectNone={() => setSelectedIds([])}
              openSections={bulkSections}
              onToggleSection={(section) =>
                setBulkSections((current) =>
                  current.includes(section) ? current.filter((item) => item !== section) : [...current, section],
                )
              }
              onExpandAll={() => setBulkSections(["copy", "og", "pages", "preview"])}
              onCollapseAll={() => setBulkSections([])}
              onPickAsset={() => setAssetPickerTarget("bulk")}
              onPrepare={applyBulkPreview}
              onSave={saveBulkPages}
            />
          )}

        </section>
      </main>

      {assetPickerTarget && (
        <AssetPicker
          assets={visibleAssets}
          query={assetQuery}
          onQuery={setAssetQuery}
          onChoose={chooseAsset}
          onClose={() => setAssetPickerTarget(null)}
        />
      )}

      {toast && (
        <div className={`toast ${toast.tone}`} role={toast.tone === "error" ? "alert" : "status"}>
          {toast.tone === "error" ? <AlertCircle size={16} /> : <Check size={16} />}
          {toast.message}
          <button onClick={() => setToast(null)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      {saveReport && (
        <SaveReportPanel
          report={saveReport}
          onRetry={() => savePages(saveReport.failed.map((item) => item.id))}
          onDismiss={() => setSaveReport(null)}
          isSaving={isSaving}
        />
      )}

    </div>
  );
}

function ThemeControl({ theme, onTheme }: { theme: ThemeChoice; onTheme: (theme: ThemeChoice) => void }) {
  const nextTheme: ThemeChoice = theme === "light" ? "dark" : "light";
  const label = "Theme: " + theme + ". Click for " + nextTheme + ".";
  return (
    <button className="theme-button header-icon" onClick={() => onTheme(nextTheme)} title={label} aria-label={label}>
      {theme === "light" && <Sun size={15} />}
      {theme === "dark" && <Moon size={15} />}
    </button>
  );
}

function EditorSkeleton() {
  return (
    <div className="editor-skeleton" aria-label="Loading Webflow pages">
      <div className="skeleton-heading">
        <span />
        <strong />
        <small />
      </div>
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="skeleton-card" key={index}>
          <span />
          <strong />
          <small />
        </div>
      ))}
    </div>
  );
}

function PageListLoader() {
  return (
    <div className="page-list-loader" aria-label="Loading pages">
      {Array.from({ length: 7 }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

function SaveReportPanel({
  report,
  onRetry,
  onDismiss,
  isSaving,
}: {
  report: SaveReport;
  onRetry: () => void;
  onDismiss: () => void;
  isSaving: boolean;
}) {
  const hasFailed = report.failed.length > 0;
  return (
    <div className={hasFailed ? "save-report error" : "save-report"} role={hasFailed ? "alert" : "status"}>
      <div>
        <strong>{hasFailed ? "Some pages were not saved" : "Save complete"}</strong>
        <span>{buildSaveSummary(report)}</span>
      </div>
      {hasFailed && (
        <div className="save-report-list">
          {report.failed.slice(0, 4).map((item) => (
            <small key={item.id}>
              {item.name}: {item.message}
            </small>
          ))}
        </div>
      )}
      <div className="save-report-actions">
        {hasFailed && (
          <button className="secondary-button" onClick={onRetry} disabled={isSaving}>
            Retry failed pages
          </button>
        )}
        <button className="ghost-button" onClick={onDismiss} disabled={isSaving}>
          Dismiss
        </button>
      </div>
    </div>
  );
}

function SingleEditor({
  page,
  isSaving,
  selectedCount,
  onPatch,
  onSave,
  onSaveSelected,
  onPickAsset,
  saveDisabled,
  saveSelectedDisabled,
}: {
  page: SeoPage;
  isSaving: boolean;
  selectedCount: number;
  onPatch: (patch: Partial<SeoPage>) => void;
  onSave: () => void;
  onSaveSelected: () => void;
  onPickAsset: () => void;
  saveDisabled: boolean;
  saveSelectedDisabled: boolean;
}) {
  const [openSections, setOpenSections] = React.useState<string[]>([]);
  const allOpen = openSections.length === 3;

  function toggleSection(section: string) {
    setOpenSections((current) =>
      current.includes(section) ? current.filter((item) => item !== section) : [...current, section],
    );
  }

  return (
    <>
      <div className="editor-heading">
        <div>
          <span className="eyebrow">Page settings</span>
          <h1 title={page.name}>{page.name}</h1>
          <p>{formatSlug(page)}</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button" onClick={onSaveSelected} disabled={isSaving || selectedCount === 0 || saveSelectedDisabled}>
            {selectedSaveLabel(selectedCount)}
          </button>
          <button className="primary-button" onClick={onSave} disabled={isSaving || saveDisabled}>
            {isSaving ? <LoaderCircle className="spin" size={16} /> : <CheckSquare size={16} />}
            Save page
          </button>
        </div>
      </div>
      {isSaving && <SaveHint />}

      <div className="bulk-toolbar">
        <button className="secondary-button" onClick={() => setOpenSections(allOpen ? [] : ["seo", "og", "image"])}>
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <div className="accordion-stack">
        <AccordionSection
          id="seo"
          title="SEO title and description"
          meta="Edit the search title and meta description for this page."
          open={openSections.includes("seo")}
          onToggle={toggleSection}
        >
          <TextField
            label="SEO title"
            value={page.seoTitle}
            recommended="Aim for 30-60 characters."
            tip={titleTip(page.seoTitle)}
            onChange={(seoTitle) => onPatch({ seoTitle })}
          />
          <TextField
            label="Meta description"
            value={page.metaDescription}
            multiline
            recommended="Aim for 120-160 characters."
            tip={descriptionTip(page.metaDescription)}
            onChange={(metaDescription) => onPatch({ metaDescription })}
          />
        </AccordionSection>

        <AccordionSection
          id="og"
          title="Open Graph title and description"
          meta="Use SEO copy or customize the social preview text."
          open={openSections.includes("og")}
          onToggle={toggleSection}
        >
          <label className="checkbox-row og-sync-row">
            <input
              type="checkbox"
              checked={page.useSeoForOg}
              onChange={(event) => {
                const useSeoForOg = event.target.checked;
                onPatch({
                  useSeoForOg,
                  ...(useSeoForOg ? { ogTitle: page.seoTitle, ogDescription: page.metaDescription } : {}),
                });
              }}
            />
            <span>Use SEO title and description for Open Graph</span>
          </label>
          <TextField
            label="Open Graph title"
            value={page.useSeoForOg ? page.seoTitle : page.ogTitle}
            recommended="Usually this can match the SEO title."
            tip={titleTip(page.useSeoForOg ? page.seoTitle : page.ogTitle)}
            disabled={page.useSeoForOg}
            onChange={(ogTitle) => onPatch({ ogTitle, useSeoForOg: false })}
          />
          <TextField
            label="Open Graph description"
            value={page.useSeoForOg ? page.metaDescription : page.ogDescription}
            multiline
            recommended="Keep it clear for social previews."
            tip={descriptionTip(page.useSeoForOg ? page.metaDescription : page.ogDescription)}
            disabled={page.useSeoForOg}
            onChange={(ogDescription) => onPatch({ ogDescription, useSeoForOg: false })}
          />
        </AccordionSection>

        <AccordionSection
          id="image"
          title="Open Graph image"
          meta="Choose from Webflow Assets or paste an image URL."
          open={openSections.includes("image")}
          onToggle={toggleSection}
        >
          <OgImageField
            value={page.ogImage}
            onChange={(ogImage) => onPatch({ ogImage })}
            onPick={onPickAsset}
            onClear={() => onPatch({ ogImage: "" })}
            compact
          />
        </AccordionSection>
      </div>

      <BottomBar
        label={selectedSaveLabel(selectedCount)}
        isSaving={isSaving}
        disabled={selectedCount === 0 || saveSelectedDisabled}
        onSave={onSaveSelected}
        secondaryLabel="Save current page"
        onSecondary={onSave}
        secondaryDisabled={saveDisabled}
      />
    </>
  );
}

function BulkEditor({
  selectedCount,
  title,
  description,
  ogImage,
  syncOg,
  previewPages,
  pages,
  selectedIds,
  isSaving,
  saveDisabled,
  onTitle,
  onDescription,
  onOgImage,
  onSyncOg,
  onTogglePage,
  onSelectAll,
  onSelectNone,
  openSections,
  onToggleSection,
  onExpandAll,
  onCollapseAll,
  onPickAsset,
  onPrepare,
  onSave,
}: {
  selectedCount: number;
  title: string;
  description: string;
  ogImage: string;
  syncOg: boolean;
  previewPages: SeoPage[];
  pages: SeoPage[];
  selectedIds: string[];
  isSaving: boolean;
  saveDisabled: boolean;
  onTitle: (value: string) => void;
  onDescription: (value: string) => void;
  onOgImage: (value: string) => void;
  onSyncOg: (value: boolean) => void;
  onTogglePage: (id: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  openSections: string[];
  onToggleSection: (section: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onPickAsset: () => void;
  onPrepare: () => void;
  onSave: () => void;
}) {
  const allOpen = openSections.length === 4;
  const previewRef = React.useRef<HTMLDivElement | null>(null);
  const titleSelectionRef = React.useRef({ start: title.length, end: title.length });

  function handlePreview() {
    onPrepare();
    if (!openSections.includes("preview")) onToggleSection("preview");
    window.setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function rememberTitleSelection(element: HTMLInputElement | HTMLTextAreaElement) {
    titleSelectionRef.current = {
      start: element.selectionStart ?? title.length,
      end: element.selectionEnd ?? title.length,
    };
  }

  function insertPageTokenAtCursor() {
    const { start, end } = titleSelectionRef.current;
    const nextTitle = `${title.slice(0, start)}{page}${title.slice(end)}`;
    const nextCursor = start + "{page}".length;
    titleSelectionRef.current = { start: nextCursor, end: nextCursor };
    onTitle(nextTitle);
  }

  return (
    <>
      <div className="editor-heading">
        <div>
          <span className="eyebrow">Bulk settings</span>
          <h1>{selectedCount} selected pages</h1>
          <p>Use <code>{"{page}"}</code> wherever the Webflow page name should appear.</p>
        </div>
        <div className="heading-actions">
          <button className="primary-button" onClick={onSave} disabled={isSaving || selectedCount === 0 || saveDisabled}>
            {isSaving ? <LoaderCircle className="spin" size={16} /> : <CheckSquare size={16} />}
            {selectedSaveLabel(selectedCount)}
          </button>
        </div>
      </div>
      {isSaving && <SaveHint />}

      <div className="bulk-toolbar">
        <button className="secondary-button" onClick={allOpen ? onCollapseAll : onExpandAll}>
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <div className="accordion-stack">
        <AccordionSection
          id="copy"
          title="SEO title and description"
          meta='Template supports "{page}" for each page name.'
          open={openSections.includes("copy")}
          onToggle={onToggleSection}
        >
          <TextField
            label="Bulk title template"
            value={title}
            recommended='Example: "{page} - SEO Title" becomes "Course - SEO Title".'
            tip={templateTitleTip(title, previewPages)}
            onChange={onTitle}
            onSelection={rememberTitleSelection}
          />
          <button className="secondary-button compact" onClick={insertPageTokenAtCursor}>
            Insert page name
          </button>
          <TextField
            label="Bulk description template"
            value={description}
            multiline
            recommended="This updates the SEO description for every selected page."
            tip={descriptionTip(description)}
            onChange={onDescription}
          />
          <div className="button-row">
            <button className="secondary-button" onClick={handlePreview} disabled={selectedCount === 0}>
              Preview in app
            </button>
          </div>
        </AccordionSection>

        <AccordionSection
          id="og"
          title="Open Graph"
          meta="Use SEO copy or set a shared social image."
          open={openSections.includes("og")}
          onToggle={onToggleSection}
        >
          <label className="checkbox-row">
            <input type="checkbox" checked={syncOg} onChange={(event) => onSyncOg(event.target.checked)} />
            <span>Use SEO title and description for Open Graph</span>
          </label>
          <OgImageField value={ogImage} onChange={onOgImage} onPick={onPickAsset} onClear={() => onOgImage("")} compact />
        </AccordionSection>

        <AccordionSection
          id="pages"
          title="Pages included"
          meta={`${selectedCount}/${pages.length} selected`}
          open={openSections.includes("pages")}
          onToggle={onToggleSection}
        >
          <div className="bulk-pages-card">
            <div className="button-row">
              <button className="ghost-button" onClick={onSelectAll}>Include all</button>
              <button className="ghost-button" onClick={onSelectNone}>Exclude all</button>
            </div>
            <div className="bulk-page-list">
              {pages.map((page) => (
                <label key={page.id} className="bulk-page-row">
                  <input type="checkbox" checked={selectedIds.includes(page.id)} onChange={() => onTogglePage(page.id)} />
                  <span>
                    <strong title={page.name}>{page.name}</strong>
                    <small title={formatSlug(page)}>{formatSlug(page)}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </AccordionSection>

        <div ref={previewRef}>
          <AccordionSection
            id="preview"
            title="Title preview"
            meta="Checks the rendered page-name title."
            open={openSections.includes("preview")}
            onToggle={onToggleSection}
          >
            <div className="preview-card">
              {previewPages.length === 0 ? (
                <p>Select at least one page to preview bulk titles.</p>
              ) : (
                previewPages.map((page) => (
                  <div className="preview-line" key={page.id}>
                    <span title={page.name}>{page.name}</span>
                    <strong title={renderTemplate(title, page)}>{renderTemplate(title, page)}</strong>
                  </div>
                ))
              )}
            </div>
          </AccordionSection>
        </div>
      </div>

      <BottomBar label={selectedSaveLabel(selectedCount)} isSaving={isSaving} disabled={selectedCount === 0 || saveDisabled} onSave={onSave} />
    </>
  );
}

function AccordionSection({
  id,
  title,
  meta,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  meta: string;
  open: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="accordion-section">
      <button className="accordion-trigger" onClick={() => onToggle(id)} aria-expanded={open}>
        <span>
          <strong>{title}</strong>
          <small>{meta}</small>
        </span>
        <ChevronRight size={16} />
      </button>
      {open && <div className="accordion-body">{children}</div>}
    </section>
  );
}

function TextField({
  label,
  value,
  recommended,
  tip,
  multiline,
  disabled,
  onChange,
  onSelection,
}: {
  label: string;
  value: string;
  recommended: string;
  tip: { tone: "ok" | "warn" | "muted"; text: string };
  multiline?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSelection?: (element: HTMLInputElement | HTMLTextAreaElement) => void;
}) {
  function handleSelection(event: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) {
    onSelection?.(event.currentTarget);
  }

  return (
    <label className="field">
      <span className="field-top">
        <strong>{label}</strong>
        <small>{value.length} chars</small>
      </span>
      {multiline ? (
        <textarea
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onClick={handleSelection}
          onKeyUp={handleSelection}
          onSelect={handleSelection}
        />
      ) : (
        <input
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onClick={handleSelection}
          onKeyUp={handleSelection}
          onSelect={handleSelection}
        />
      )}
      <span className={`tip ${tip.tone}`}>{tip.text || recommended}</span>
      <span className="hint">{recommended}</span>
    </label>
  );
}

function OgImageField({
  value,
  onChange,
  onPick,
  onClear,
  compact,
}: {
  value: string;
  onChange: (value: string) => void;
  onPick: () => void;
  onClear: () => void;
  compact?: boolean;
}) {
  const validation = validateImageUrl(value);
  const safePreviewUrl = validation.valid ? normalizeImageUrl(value) : "";
  return (
    <div className={compact ? "og-field compact" : "og-field"}>
      <div>
        <strong>Open Graph image</strong>
        <span>Select from assets or paste a direct HTTPS JPG or PNG URL.</span>
      </div>
      {safePreviewUrl ? <img src={safePreviewUrl} alt="" /> : <div className="image-empty"><Image size={20} /></div>}
      <div className="og-image-actions">
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="https://example.com/image.jpg" aria-label="Open Graph image URL" />
        <button className="secondary-button" onClick={onPick}>
          <Images size={16} />
          Choose image
        </button>
        {value && (
          <button className="ghost-button" onClick={onClear}>
            Clear
          </button>
        )}
        {!validation.valid && (
          <span className="field-error" role="alert">
            <AlertCircle size={13} />
            {validation.error}
          </span>
        )}
      </div>
    </div>
  );
}

function BottomBar({
  label,
  isSaving,
  disabled,
  onSave,
  secondaryLabel,
  onSecondary,
  secondaryDisabled,
}: {
  label: string;
  isSaving: boolean;
  disabled: boolean;
  onSave: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryDisabled?: boolean;
}) {
  return (<>
    <div className="bottom-save-bar">
      <div className="bottom-save-actions">
        {secondaryLabel && onSecondary && (
          <button className="secondary-button" onClick={onSecondary} disabled={isSaving || secondaryDisabled}>
            {secondaryLabel}
          </button>
        )}
        <button className="primary-button" onClick={onSave} disabled={disabled || isSaving}>
          {isSaving ? <LoaderCircle className="spin" size={16} /> : <CheckSquare size={16} />}
          {label}
        </button>
      </div>
    </div>
    {isSaving && <SaveHint />}
  </>);
}

function SaveHint() {
  return (
    <div className="save-hint" role="status">
      <LoaderCircle className="spin" size={13} />
      <span>Saving. Keep Webflow Page Settings closed until this finishes.</span>
    </div>
  );
}

function AssetPicker({
  assets,
  query,
  onQuery,
  onChoose,
  onClose,
}: {
  assets: AssetItem[];
  query: string;
  onQuery: (value: string) => void;
  onChoose: (asset: AssetItem) => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop">
      <section className="asset-modal" aria-label="Choose Open Graph image">
        <div className="modal-heading">
          <div>
            <h2>Choose OG image</h2>
            <p>Images are loaded from Webflow Assets. Only JPG and PNG can be used for Open Graph.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close image picker">
            <X size={18} />
          </button>
        </div>
        <div className="search-wrap">
          <Search size={16} />
          <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search assets" />
        </div>
        <div className="asset-grid">
          {assets.map((asset) => {
            const validation = validateImageUrl(asset.url);
            return (
              <button
                className={validation.valid ? "asset-item" : "asset-item disabled"}
                key={asset.id}
                onClick={() => validation.valid && onChoose(asset)}
                disabled={!validation.valid}
                title={validation.valid ? asset.name : validation.error}
              >
                <img src={asset.url} alt="" />
                <span>{asset.name}</span>
                {!validation.valid && <small>JPG or PNG only</small>}
              </button>
            );
          })}
          {assets.length === 0 && (
            <div className="empty-state">
              <Image size={24} />
              <strong>No image assets found</strong>
              <span>Upload JPG or PNG images in Webflow Assets, then reload this app.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function validateImageUrl(url: string): { valid: boolean; error?: string } {
  const trimmed = url.trim();
  if (!trimmed) return { valid: true };

  if (trimmed.startsWith("//")) {
    return { valid: false, error: "Protocol-relative URLs are not allowed. Use a full HTTPS image URL." };
  }

  if (/^(javascript|data|file|blob):/i.test(trimmed)) {
    return { valid: false, error: "Unsupported URL scheme. Use a direct HTTPS image URL." };
  }

  if (/\s|[\u0000-\u001f\u007f]/.test(trimmed)) {
    return { valid: false, error: "Image URLs cannot contain spaces or control characters." };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: "Enter a complete HTTPS image URL." };
  }

  if (parsed.protocol !== "https:") {
    return { valid: false, error: "Only HTTPS image URLs are allowed." };
  }

  if (!parsed.hostname || parsed.username || parsed.password) {
    return { valid: false, error: "Use a public HTTPS image URL without credentials." };
  }

  if (parsed.hash) {
    return { valid: false, error: "Remove URL fragments from the image URL." };
  }

  const supportedOgImageExts = /\.(jpe?g|png)$/i;
  if (!supportedOgImageExts.test(parsed.pathname)) {
    return { valid: false, error: "Open Graph images must be direct JPG or PNG files." };
  }

  return { valid: true };
}

function normalizeImageUrl(url: string) {
  return url.trim();
}

async function readPageMetadata(ref: WebflowPageRef): Promise<Partial<WebflowPageMetadata>> {
  const usesTitleAsSearchTitle = (await ref.usesTitleAsSearchTitle?.()) ?? true;
  const usesDescriptionAsSearchDescription = (await ref.usesDescriptionAsSearchDescription?.()) ?? true;
  const usesTitleAsOpenGraphTitle = (await ref.usesTitleAsOpenGraphTitle?.()) ?? true;
  const usesDescriptionAsOpenGraphDescription = (await ref.usesDescriptionAsOpenGraphDescription?.()) ?? true;
  return {
    title: (await ref.getTitle?.()) ?? "",
    description: (await ref.getDescription?.()) ?? "",
    usesTitleAsSearchTitle,
    searchTitle: usesTitleAsSearchTitle ? "" : (await ref.getSearchTitle?.()) ?? "",
    usesDescriptionAsSearchDescription,
    searchDescription: usesDescriptionAsSearchDescription ? "" : (await ref.getSearchDescription?.()) ?? "",
    usesTitleAsOpenGraphTitle,
    openGraphTitle: usesTitleAsOpenGraphTitle ? "" : (await ref.getOpenGraphTitle?.()) ?? "",
    usesDescriptionAsOpenGraphDescription,
    openGraphDescription: usesDescriptionAsOpenGraphDescription ? "" : (await ref.getOpenGraphDescription?.()) ?? "",
    openGraphImage: (await ref.getOpenGraphImage?.()) ?? "",
  };
}

function buildPageMetadata(page: SeoPage, isExcludedFromSearch: boolean): Partial<WebflowPageMetadata> {
  const title = page.seoTitle.trim();
  const description = page.metaDescription.trim();
  const metadata: Partial<WebflowPageMetadata> = {
    title,
    description,
    usesTitleAsOpenGraphTitle: page.useSeoForOg,
    usesDescriptionAsOpenGraphDescription: page.useSeoForOg,
    openGraphImage: normalizeImageUrl(page.ogImage),
  };

  if (!isExcludedFromSearch) {
    metadata.usesTitleAsSearchTitle = false;
    metadata.searchTitle = title;
    metadata.usesDescriptionAsSearchDescription = false;
    metadata.searchDescription = description;
  }

  if (!page.useSeoForOg) {
    metadata.openGraphTitle = page.ogTitle.trim();
    metadata.openGraphDescription = page.ogDescription.trim();
  }

  return metadata;
}

async function savePageWithIndividualSetters(
  ref: WebflowPageRef,
  page: SeoPage,
  metadata: Partial<WebflowPageMetadata>,
) {
  await withTimeout(ref.setTitle?.(metadata.title ?? "") ?? Promise.resolve(null), SAVE_TIMEOUT_MS, `Saving ${page.name} title timed out.`);
  await withTimeout(
    ref.setDescription?.(metadata.description ?? "") ?? Promise.resolve(null),
    SAVE_TIMEOUT_MS,
    `Saving ${page.name} description timed out.`,
  );

  if (metadata.usesTitleAsSearchTitle === false) {
    await withTimeout(ref.useTitleAsSearchTitle?.(false) ?? Promise.resolve(null), SAVE_TIMEOUT_MS, `Saving ${page.name} search title mode timed out.`);
    await withTimeout(ref.setSearchTitle?.(metadata.searchTitle ?? "") ?? Promise.resolve(null), SAVE_TIMEOUT_MS, `Saving ${page.name} search title timed out.`);
  }

  if (metadata.usesDescriptionAsSearchDescription === false) {
    await withTimeout(
      ref.useDescriptionAsSearchDescription?.(false) ?? Promise.resolve(null),
      SAVE_TIMEOUT_MS,
      `Saving ${page.name} search description mode timed out.`,
    );
    await withTimeout(
      ref.setSearchDescription?.(metadata.searchDescription ?? "") ?? Promise.resolve(null),
      SAVE_TIMEOUT_MS,
      `Saving ${page.name} search description timed out.`,
    );
  }

  await withTimeout(
    ref.useTitleAsOpenGraphTitle?.(Boolean(metadata.usesTitleAsOpenGraphTitle)) ?? Promise.resolve(null),
    SAVE_TIMEOUT_MS,
    `Saving ${page.name} Open Graph title mode timed out.`,
  );
  await withTimeout(
    ref.useDescriptionAsOpenGraphDescription?.(Boolean(metadata.usesDescriptionAsOpenGraphDescription)) ?? Promise.resolve(null),
    SAVE_TIMEOUT_MS,
    `Saving ${page.name} Open Graph description mode timed out.`,
  );

  if (!metadata.usesTitleAsOpenGraphTitle) {
    await withTimeout(ref.setOpenGraphTitle?.(metadata.openGraphTitle ?? "") ?? Promise.resolve(null), SAVE_TIMEOUT_MS, `Saving ${page.name} Open Graph title timed out.`);
  }

  if (!metadata.usesDescriptionAsOpenGraphDescription) {
    await withTimeout(
      ref.setOpenGraphDescription?.(metadata.openGraphDescription ?? "") ?? Promise.resolve(null),
      SAVE_TIMEOUT_MS,
      `Saving ${page.name} Open Graph description timed out.`,
    );
  }

  await withTimeout(ref.setOpenGraphImage?.(metadata.openGraphImage ?? "") ?? Promise.resolve(null), SAVE_TIMEOUT_MS, `Saving ${page.name} Open Graph image timed out.`);
}

async function restorePageMetadata(ref: WebflowPageRef, previousMetadata: Partial<WebflowPageMetadata>) {
  if (ref.setMetadata) {
    await withTimeout(ref.setMetadata(previousMetadata), SAVE_TIMEOUT_MS, "Restoring previous page metadata timed out.");
    return;
  }
  await withTimeout(ref.setTitle?.(previousMetadata.title ?? "") ?? Promise.resolve(null), SAVE_TIMEOUT_MS, "Restoring page title timed out.");
  await withTimeout(ref.setDescription?.(previousMetadata.description ?? "") ?? Promise.resolve(null), SAVE_TIMEOUT_MS, "Restoring page description timed out.");
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

function buildSaveSummary(report: SaveReport) {
  const parts = [`${report.success.length} saved`];
  if (report.failed.length) parts.push(`${report.failed.length} failed`);
  if (report.skipped.length) parts.push(`${report.skipped.length} skipped`);
  return parts.join(", ") + ".";
}

function renderTemplate(template: string, page: SeoPage) {
  return template.replace(/\{page\}/g, page.name).trim();
}

function isMissingSeoTitle(page: SeoPage) {
  return !page.seoTitle.trim();
}

function isMissingMetaDescription(page: SeoPage) {
  return !page.metaDescription.trim();
}

function isMissingSeoCopy(page: SeoPage) {
  return isMissingSeoTitle(page) || isMissingMetaDescription(page);
}

function selectedSaveLabel(count: number) {
  return `Save ${count} selected page${count === 1 ? "" : "s"}`;
}

function sortLabel(sort: SortChoice) {
  if (sort === "seo-status") return "SEO status";
  if (sort === "az") return "A-Z";
  if (sort === "za") return "Z-A";
  return "Grouped";
}

function formatSlug(page: { slug: string; url: string }) {
  if (page.slug) return page.slug.startsWith("/") ? page.slug : `/${page.slug}`;
  return page.url || "Page";
}

function reconcileSelectedIds(currentSelectedIds: string[], nextPages: SeoPage[]) {
  const nextIds = new Set(nextPages.map((page) => page.id));
  const nextSelectedIds = currentSelectedIds.filter((id) => nextIds.has(id));
  return arraysEqual(currentSelectedIds, nextSelectedIds) ? currentSelectedIds : nextSelectedIds;
}

function pageListSignature(pages: SeoPage[]) {
  return pages.map((page) => `${page.id}:${page.name}:${page.slug}:${page.groupLabel}`).join("|");
}

function countNewPages(previousPages: SeoPage[], nextPages: SeoPage[]) {
  const previousIds = new Set(previousPages.map((page) => page.id));
  return nextPages.filter((page) => !previousIds.has(page.id)).length;
}

function arraysEqual(first: string[], second: string[]) {
  return first.length === second.length && first.every((item, index) => item === second[index]);
}

function orderPagesLikeWebflow(items: WebflowPageRef[], pages: LoadedPage[]): SeoPage[] {
  const pagesById = new Map(pages.map((page) => [page.id, page]));
  const ordered: SeoPage[] = [];
  const addedIds = new Set<string>();

  for (const item of items) {
    if (item.type !== "Page" || !item.id || addedIds.has(item.id)) continue;
    const page = pagesById.get(item.id);
    if (!page) continue;
    const { parentId: _parentId, sourceIndex: _sourceIndex, ...seoPage } = page;
    ordered.push(seoPage);
    addedIds.add(item.id);
  }

  for (const page of pages) {
    if (!addedIds.has(page.id)) {
      const { parentId: _parentId, sourceIndex: _sourceIndex, ...seoPage } = page;
      ordered.push(seoPage);
      addedIds.add(page.id);
    }
  }

  return ordered;
}

function getPageGroupLabel(
  parentId: string | null,
  kind: Awaited<ReturnType<NonNullable<WebflowPageRef["getKind"]>>> | undefined,
  folderNames: Map<string, string>,
) {
  if (parentId && folderNames.has(parentId)) return folderNames.get(parentId) ?? "Folder";
  if (kind === "utility") return "Utility pages";
  if (kind === "cms") return "CMS pages";
  if (kind === "ecommerce") return "Ecommerce pages";
  if (kind === "userSystems") return "User pages";
  return "Static pages";
}

function buildSidebarRows(pages: SeoPage[], query: string): SidebarRow[] {
  if (query.trim()) return pages.map((page) => ({ type: "page", page }));

  const rows: SidebarRow[] = [];
  const pagesByGroup = new Map<string, SeoPage[]>();

  for (const page of pages) {
    const groupPages = pagesByGroup.get(page.groupLabel) ?? [];
    groupPages.push(page);
    pagesByGroup.set(page.groupLabel, groupPages);
  }

  for (const [label, groupPages] of pagesByGroup) {
    rows.push({ type: "group", id: `group-${label}`, label });
    rows.push(...groupPages.map((page) => ({ type: "page" as const, page })));
  }

  return rows;
}

function buildSeoStatusRows(pages: SeoPage[]): SidebarRow[] {
  const groups = [
    {
      id: "missing-title-description",
      label: "Missing title and description",
      pages: pages.filter((page) => isMissingSeoTitle(page) && isMissingMetaDescription(page)),
    },
    {
      id: "missing-description",
      label: "Missing description",
      pages: pages.filter((page) => !isMissingSeoTitle(page) && isMissingMetaDescription(page)),
    },
    {
      id: "missing-title",
      label: "Missing title",
      pages: pages.filter((page) => isMissingSeoTitle(page) && !isMissingMetaDescription(page)),
    },
    {
      id: "complete-seo",
      label: "Complete SEO",
      pages: pages.filter((page) => !isMissingSeoCopy(page)),
    },
  ];

  return groups.flatMap((group) =>
    group.pages.length
      ? [
          { type: "group" as const, id: group.id, label: `${group.label} (${group.pages.length})` },
          ...group.pages.map((page) => ({ type: "page" as const, page })),
        ]
      : [],
  );
}

function sortPagesForSidebar(pages: SeoPage[], sort: SortChoice) {
  if (sort === "az") return [...pages].sort(comparePagesByName);
  if (sort === "za") return [...pages].sort((a, b) => comparePagesByName(b, a));
  return pages;
}

function comparePagesByName(a: SeoPage, b: SeoPage) {
  return (
    a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true }) ||
    a.slug.localeCompare(b.slug, undefined, { sensitivity: "base", numeric: true })
  );
}

function sortPagesByWebflowSection(pages: SeoPage[]) {
  return [...pages].sort((a, b) => groupPriority(a.groupLabel) - groupPriority(b.groupLabel));
}

function groupPriority(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("static")) return 0;
  if (normalized.includes("cms")) return 1;
  if (normalized.includes("utility")) return 2;
  if (normalized.includes("ecommerce")) return 3;
  if (normalized.includes("user")) return 4;
  return 0;
}

function titleTip(value: string) {
  if (!value.trim()) return { tone: "muted" as const, text: "Add a clear title before saving." };
  if (value.length < 30) return { tone: "warn" as const, text: "This is a little short. Add context or a keyword if useful." };
  if (value.length > 60) return { tone: "warn" as const, text: "This may be too long for search results. Try to keep it under 60 characters." };
  return { tone: "ok" as const, text: "Good length for a search title." };
}

function templateTitleTip(template: string, pages: SeoPage[]) {
  if (!template.trim()) return { tone: "muted" as const, text: "Add a title template before applying bulk changes." };
  if (template.includes("{page}")) {
    const rendered = pages.map((page) => renderTemplate(template, page));
    const longest = rendered.reduce((max, item) => Math.max(max, item.length), 0);
    if (longest > 70) {
      return { tone: "warn" as const, text: "Some long page names may create long titles. The template itself is valid." };
    }
    return { tone: "ok" as const, text: "Template looks good. Each page will use its own page name." };
  }
  return titleTip(template);
}

function descriptionTip(value: string) {
  if (!value.trim()) return { tone: "muted" as const, text: "Add a helpful summary of what this page is about." };
  if (value.length < 120) return { tone: "warn" as const, text: "This is short. Add one specific benefit or reason to visit the page." };
  if (value.length > 160) return { tone: "warn" as const, text: "This may be truncated. Tighten it to around 120-160 characters." };
  return { tone: "ok" as const, text: "Good length for a meta description." };
}

function toCsv(rows: SeoPage[]) {
  const headers = ["id", "name", "slug", "url", "seoTitle", "metaDescription", "ogTitle", "ogDescription", "ogImage", "useSeoForOg"];
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escapeCsv(String(row[header as keyof SeoPage] ?? ""))).join(","))].join("\n");
}

function parseCsv(text: string, currentPages: SeoPage[]): CsvImportResult {
  const table = parseCsvTable(text);
  const [headers = [], ...rows] = table;
  const normalizedHeaders = headers.map((header) => header.trim());
  const allowedHeaders = new Set(["id", "name", "slug", "url", "groupLabel", "seoTitle", "metaDescription", "ogTitle", "ogDescription", "ogImage", "useSeoForOg"]);
  const result: CsvImportResult = { rows: [], invalidRows: [], skippedRows: [] };
  if (!normalizedHeaders.includes("id")) {
    result.invalidRows.push("Missing required id column.");
    return result;
  }

  const unsupportedHeaders = normalizedHeaders.filter((header) => header && !allowedHeaders.has(header));
  if (unsupportedHeaders.length) {
    result.invalidRows.push(`Unsupported columns: ${unsupportedHeaders.join(", ")}`);
    return result;
  }

  const pagesById = new Map(currentPages.map((page) => [page.id, page]));
  const seenIds = new Set<string>();
  rows.forEach((values, rowIndex) => {
    if (!values.some((value) => value.trim())) return;
    const row = Object.fromEntries(normalizedHeaders.map((header, valueIndex) => [header, values[valueIndex] ?? ""]));
    const id = String(row.id ?? "").trim();
    if (!id) {
      result.invalidRows.push(`Row ${rowIndex + 2}: missing page id.`);
      return;
    }
    if (seenIds.has(id)) {
      result.invalidRows.push(`Row ${rowIndex + 2}: duplicate page id.`);
      return;
    }
    seenIds.add(id);
    if (!pagesById.has(id)) {
      result.skippedRows.push(`Row ${rowIndex + 2}: unmatched page id.`);
      return;
    }

    const patch: Partial<SeoPage> = {};
    for (const header of normalizedHeaders) {
      if (["id", "name", "slug", "url", "groupLabel"].includes(header) || !(header in row)) continue;
      const value = String(row[header] ?? "");
      if (header === "ogImage") {
        const validation = validateImageUrl(value);
        if (!validation.valid) {
          result.invalidRows.push(`Row ${rowIndex + 2}: ${validation.error ?? "Invalid Open Graph image URL."}`);
          return;
        }
      }
      if (header === "useSeoForOg") {
        patch.useSeoForOg = ["true", "1", "yes"].includes(value.trim().toLowerCase());
      } else if (header) {
        patch[header as keyof SeoPage] = value as never;
      }
    }

    result.rows.push({ id, patch });
  });

  return result;
}

function parseCsvTable(text: string) {
  const rows: string[][] = [];
  let cells: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      cells.push(value);
      rows.push(cells);
      cells = [];
      value = "";
    } else {
      value += char;
    }
  }
  cells.push(value);
  if (cells.length > 1 || cells[0].trim()) rows.push(cells);
  return rows;
}

function escapeCsv(value: string) {
  const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safeValue) ? `"${safeValue.replace(/"/g, '""')}"` : safeValue;
}

function downloadFile(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
