import { describe, it, expect, vi, beforeEach } from "vitest";
import HomePage from "./HomePage.svelte";
import { renderWithProviders } from "../../../test-utils";
import { linkTreesStore } from "../states/linkTreesStore";
import linkTreeApi from "../api/linkTreeApi";
import * as routerModule from "../../../router";
import * as toolsHelper from "../../../helpers/toolsHelper";

vi.mock("../api/linkTreeApi", () => ({
  default: {
    getLinkTrees: vi.fn(),
    getLinkTreeById: vi.fn(),
  },
}));

const TID = (id) => `[data-testid="${id}"]`;
const settle = () => new Promise((r) => setTimeout(r, 25));
const profile = { id: 1, name: "Abdullah", email: "abdul@del.org" };
const items = [
  { id: 1, user_id: 1, title: "Tautan Saya", type: "public", description: "Semua tautan penting", cover: "https://example.com/1.jpg", created_at: "2026-10-05T08:34:04.000000Z", author: { name: "Abdullah" } },
  { id: 2, user_id: 2, title: "Portofolio", type: "unlisted", description: null, cover: null, created_at: "2026-10-06T08:34:04.000000Z", author: null },
  { id: 3, user_id: 3, title: null, type: "private", description: "Rahasia", cover: null, created_at: "2026-10-07T08:34:04.000000Z", author: { name: "Cici" } },
  { id: 4, user_id: 4, title: "Lain", type: "lainnya", description: "x", cover: null, created_at: "2026-10-08T08:34:04.000000Z", author: { name: "Dedi" } },
];

async function renderPage(preloadedState = { profile }) {
  const result = renderWithProviders(HomePage, { preloadedState });
  await settle();
  return result;
}

describe("HomePage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    linkTreesStore.reset();
    vi.mocked(linkTreeApi.getLinkTrees).mockReset();
    vi.mocked(linkTreeApi.getLinkTrees).mockResolvedValue(items);
  });

  it("should render nothing when the profile is missing", async () => {
    const { wrapper } = await renderPage({ profile: null });
    expect(wrapper.find("h1").exists()).toBe(false);
  });

  it("should load all link trees by default and show the header", async () => {
    const { wrapper } = await renderPage();
    expect(linkTreeApi.getLinkTrees).toHaveBeenCalledWith(false);
    expect(wrapper.find("h1").text()).toBe("Semua Link Tree");
    expect(wrapper.find(TID("delete-all-link-trees-btn")).exists()).toBe(false);
  });

  it("should show statistics computed from the list", async () => {
    const { wrapper } = await renderPage();
    expect(wrapper.find(TID("stat-total")).text()).toBe("4");
    expect(wrapper.find(TID("stat-public")).text()).toBe("1");
    expect(wrapper.find(TID("stat-unlisted")).text()).toBe("1");
    expect(wrapper.find(TID("stat-private")).text()).toBe("1");
  });

  it("should render cards with cover, type badges, author and fallbacks", async () => {
    const { wrapper } = await renderPage();
    const card1 = wrapper.find(TID("link-tree-card-1"));
    expect(card1.text()).toContain("Tautan Saya");
    expect(card1.text()).toContain("Abdullah");
    expect(card1.find("img").attributes("src")).toBe("https://example.com/1.jpg");
    expect(wrapper.find(TID("link-tree-type-1")).text().trim()).toBe("Publik");
    expect(wrapper.find(TID("link-tree-type-1")).classes("bg-emerald-50")).toBe(true);

    const card2 = wrapper.find(TID("link-tree-card-2"));
    expect(card2.find("img").exists()).toBe(false);
    expect(card2.text()).toContain("Pengguna");
    expect(wrapper.find(TID("link-tree-type-2")).text().trim()).toBe("Unlisted");
    expect(wrapper.find(TID("link-tree-type-3")).text().trim()).toBe("Privat");
    expect(wrapper.find(TID("link-tree-type-4")).text().trim()).toBe("lainnya");
  });

  it("should update a card badge when the list changes", async () => {
    const { wrapper } = await renderPage();
    expect(wrapper.find(TID("link-tree-type-1")).text().trim()).toBe("Publik");

    linkTreesStore.setLinkTrees(items.map((i) => (i.id === 1 ? { ...i, type: "private" } : i)));
    await settle();
    expect(wrapper.find(TID("link-tree-type-1")).text().trim()).toBe("Privat");
  });

  it("should live-search title and description and tolerate null fields", async () => {
    const { wrapper } = await renderPage();
    const search = wrapper.find(TID("search-link-tree-input"));

    await search.setValue("portofolio");
    await settle();
    expect(wrapper.find(TID("link-tree-card-2")).exists()).toBe(true);
    expect(wrapper.find(TID("link-tree-card-1")).exists()).toBe(false);
    expect(wrapper.find(TID("link-tree-card-3")).exists()).toBe(false);

    await search.setValue("RAHASIA");
    await settle();
    expect(wrapper.find(TID("link-tree-card-3")).exists()).toBe(true);

    await search.setValue("tidak ada");
    await settle();
    expect(wrapper.text()).toContain("Belum ada link tree yang cocok.");

    await search.setValue("   ");
    await settle();
    expect(wrapper.findAll('[data-testid^="link-tree-card-"]')).toHaveLength(4);
  });

  it("should switch between all and own link trees", async () => {
    const { wrapper } = await renderPage();

    await wrapper.find(TID("scope-mine-btn")).trigger("click");
    await settle();
    expect(linkTreeApi.getLinkTrees).toHaveBeenLastCalledWith(true);
    expect(wrapper.find(TID("delete-all-link-trees-btn")).exists()).toBe(true);

    await wrapper.find(TID("scope-all-btn")).trigger("click");
    await settle();
    expect(linkTreeApi.getLinkTrees).toHaveBeenLastCalledWith(false);
    expect(wrapper.find(TID("delete-all-link-trees-btn")).exists()).toBe(false);
  });

  it("should show the loading state, the empty state, and ignore a late response after unmount", async () => {
    let resolveLoad = () => {};
    vi.mocked(linkTreeApi.getLinkTrees).mockReturnValue(new Promise((resolve) => { resolveLoad = resolve; }));
    const loading = renderWithProviders(HomePage, { preloadedState: { profile } });
    await settle();
    expect(loading.wrapper.text()).toContain("Memuat link tree...");
    loading.unmount();
    resolveLoad([]);
    await settle();

    vi.mocked(linkTreeApi.getLinkTrees).mockResolvedValue([]);
    const empty = await renderPage();
    expect(empty.wrapper.text()).toContain("Belum ada link tree yang cocok.");
  });

  it("should navigate to the detail page from a card", async () => {
    const navSpy = vi.spyOn(routerModule, "navigate").mockImplementation(() => {});
    const { wrapper } = await renderPage();
    await wrapper.find(TID("link-tree-link-2")).trigger("click");
    expect(navSpy).toHaveBeenCalledWith("/link-trees/2");
  });

  it("should open and close the add modal and reload after a successful add", async () => {
    const { wrapper } = await renderPage();
    expect(wrapper.find(TID("add-link-tree-modal")).exists()).toBe(false);
    await wrapper.find(TID("add-link-tree-btn")).trigger("click");
    expect(wrapper.find(TID("add-link-tree-modal")).exists()).toBe(true);
    await wrapper.find(TID("close-add-modal-btn")).trigger("click");
    await settle();
    expect(wrapper.find(TID("add-link-tree-modal")).exists()).toBe(false);

    const before = vi.mocked(linkTreeApi.getLinkTrees).mock.calls.length;
    linkTreesStore.setIsLinkTreeAdded(true);
    linkTreesStore.setIsLinkTreeAdd(true);
    await settle();
    expect(vi.mocked(linkTreeApi.getLinkTrees).mock.calls.length).toBeGreaterThan(before);
  });

  it("should delete a link tree after confirmation only", async () => {
    const confirm = vi.spyOn(toolsHelper, "showConfirmDialog");
    const del = vi.spyOn(linkTreesStore, "asyncSetIsLinkTreeDelete").mockImplementation(() => {});
    const { wrapper } = await renderPage();

    confirm.mockResolvedValueOnce({ isConfirmed: false });
    await wrapper.find(TID("delete-link-tree-1")).trigger("click");
    await settle();
    expect(del).not.toHaveBeenCalled();

    confirm.mockResolvedValueOnce({ isConfirmed: true });
    await wrapper.find(TID("delete-link-tree-1")).trigger("click");
    await settle();
    expect(del).toHaveBeenCalledWith(1);
  });

  it("should reload after a successful delete and not after a failed one", async () => {
    await renderPage();
    const base = vi.mocked(linkTreeApi.getLinkTrees).mock.calls.length;

    linkTreesStore.setIsLinkTreeDeleted(false);
    linkTreesStore.setIsLinkTreeDelete(true);
    await settle();
    expect(vi.mocked(linkTreeApi.getLinkTrees).mock.calls.length).toBe(base);

    linkTreesStore.setIsLinkTreeDeleted(true);
    linkTreesStore.setIsLinkTreeDelete(true);
    await settle();
    expect(vi.mocked(linkTreeApi.getLinkTrees).mock.calls.length).toBe(base + 1);
    expect(linkTreesStore.isLinkTreeDeleted).toBe(false);
  });

  it("should delete all own link trees after confirmation only", async () => {
    const confirm = vi.spyOn(toolsHelper, "showConfirmDialog");
    const delAll = vi.spyOn(linkTreesStore, "asyncSetIsLinkTreeDeleteAll").mockImplementation(() => {});
    const { wrapper } = await renderPage();
    await wrapper.find(TID("scope-mine-btn")).trigger("click");
    await settle();

    confirm.mockResolvedValueOnce({ isConfirmed: false });
    await wrapper.find(TID("delete-all-link-trees-btn")).trigger("click");
    await settle();
    expect(delAll).not.toHaveBeenCalled();

    confirm.mockResolvedValueOnce({ isConfirmed: true });
    await wrapper.find(TID("delete-all-link-trees-btn")).trigger("click");
    await settle();
    expect(delAll).toHaveBeenCalledTimes(1);
  });

  it("should reload after a successful delete-all and not after a failed one", async () => {
    await renderPage();
    const base = vi.mocked(linkTreeApi.getLinkTrees).mock.calls.length;

    linkTreesStore.setIsLinkTreeDeletedAll(false);
    linkTreesStore.setIsLinkTreeDeleteAll(true);
    await settle();
    expect(vi.mocked(linkTreeApi.getLinkTrees).mock.calls.length).toBe(base);

    linkTreesStore.setIsLinkTreeDeletedAll(true);
    linkTreesStore.setIsLinkTreeDeleteAll(true);
    await settle();
    expect(vi.mocked(linkTreeApi.getLinkTrees).mock.calls.length).toBe(base + 1);
    expect(linkTreesStore.isLinkTreeDeletedAll).toBe(false);
  });
});
