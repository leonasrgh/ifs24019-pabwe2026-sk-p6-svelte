import { describe, it, expect, vi, beforeEach } from "vitest";
import AddModal from "./AddModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import { linkTreesStore } from "../states/linkTreesStore";
import * as toolsHelper from "../../../helpers/toolsHelper";

const TID = (id) => `[data-testid="${id}"]`;
const tick = () => new Promise((r) => setTimeout(r, 10));

describe("AddModal", () => {
  let errorSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => Promise.resolve({}));
  });

  it("should not render when show is false and unlock body scroll", () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: false } });
    expect(wrapper.find(TID("add-link-tree-modal")).exists()).toBe(false);
    expect(document.body.style.overflow).toBe("auto");
  });

  it("should render with the default visibility and lock body scroll", () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });
    expect(wrapper.find(TID("add-link-tree-modal")).exists()).toBe(true);
    expect(wrapper.find(TID("add-link-tree-type-select")).element.value).toBe("public");
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("should validate title and description", async () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });

    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenLastCalledWith("Judul tidak boleh kosong");

    await wrapper.find(TID("add-link-tree-title-input")).setValue("Tautan Saya");
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenLastCalledWith("Deskripsi tidak boleh kosong");
  });

  it("should submit trimmed values with the chosen visibility and show loading", async () => {
    const addSpy = vi.spyOn(linkTreesStore, "asyncSetIsLinkTreeAdd").mockImplementation(() => {});
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });

    await wrapper.find(TID("add-link-tree-title-input")).setValue("  Tautan Saya  ");
    await wrapper.find(TID("add-link-tree-type-select")).setValue("private");
    await wrapper.find(TID("add-link-tree-description-input")).setValue("  Kumpulan tautan  ");
    await wrapper.find("form").trigger("submit");
    await tick();

    expect(addSpy).toHaveBeenCalledWith("Tautan Saya", "private", "Kumpulan tautan");
    expect(wrapper.text()).toContain("Menyimpan...");
    expect(wrapper.find(TID("submit-add-modal-btn")).attributes("disabled")).not.toBeNull();
  });

  it("should reload the list, reset the form and close when add succeeded", async () => {
    const reload = vi.spyOn(linkTreesStore, "asyncReloadLinkTrees").mockImplementation(() => {});
    const onClose = vi.fn();
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true, onClose } });
    await wrapper.find(TID("add-link-tree-title-input")).setValue("Judul");

    linkTreesStore.setIsLinkTreeAdded(true);
    linkTreesStore.setIsLinkTreeAdd(true);
    await tick();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(linkTreesStore.isLinkTreeAdd).toBe(false);
    expect(linkTreesStore.isLinkTreeAdded).toBe(false);
    expect(wrapper.find(TID("add-link-tree-title-input")).element.value).toBe("");
  });

  it("should close without an onClose callback and stay open when add failed", async () => {
    vi.spyOn(linkTreesStore, "asyncReloadLinkTrees").mockImplementation(() => {});
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });

    linkTreesStore.setIsLinkTreeAdded(true);
    linkTreesStore.setIsLinkTreeAdd(true);
    await tick();
    expect(linkTreesStore.isLinkTreeAdd).toBe(false);

    linkTreesStore.setIsLinkTreeAdded(false);
    linkTreesStore.setIsLinkTreeAdd(true);
    await tick();
    expect(wrapper.find(TID("add-link-tree-modal")).exists()).toBe(true);
  });

  it("should call onClose from the close and cancel buttons", async () => {
    const onClose = vi.fn();
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true, onClose } });
    await wrapper.find(TID("close-add-modal-btn")).trigger("click");
    await wrapper.find(TID("cancel-add-modal-btn")).trigger("click");
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
