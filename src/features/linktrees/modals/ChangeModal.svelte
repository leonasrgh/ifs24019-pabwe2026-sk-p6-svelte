<script>
  import { Pencil, Save, X, LoaderCircle } from "lucide-svelte";
  import { linkTreesStore } from "../states/linkTreesStore";
  import { showErrorDialog } from "../../../helpers/toolsHelper";

  export let show = false;
  export let linkTree = null;
  export let onClose = undefined;

  let loading = false;
  let title = "";
  let type = "public";
  let description = "";

  function handleClose() {
    if (onClose) onClose();
  }

  $: {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }

  $: if (show && linkTree) {
    title = linkTree.title || "";
    type = linkTree.type || "public";
    description = linkTree.description || "";
  }

  $: if ($linkTreesStore.isLinkTreeChange) {
    loading = false;
    linkTreesStore.setIsLinkTreeChange(false);
    if ($linkTreesStore.isLinkTreeChanged) {
      linkTreesStore.setIsLinkTreeChanged(false);
      linkTreesStore.asyncSetLinkTree(linkTree.id);
      handleClose();
    }
  }

  function handleSave() {
    if (!title.trim()) {
      showErrorDialog("Judul tidak boleh kosong");
      return;
    }

    if (!description.trim()) {
      showErrorDialog("Deskripsi tidak boleh kosong");
      return;
    }

    loading = true;
    linkTreesStore.asyncSetIsLinkTreeChange(linkTree.id, title.trim(), type, description.trim());
  }
</script>

{#if show && linkTree}
  <div
    data-testid="edit-link-tree-modal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
  >
    <div class="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <Pencil size={18} strokeWidth={2.5} />
          </div>
          <h2 class="text-base font-bold text-slate-800">Ubah Link Tree</h2>
        </div>
        <button
          type="button"
          data-testid="close-edit-modal-btn"
          aria-label="Tutup"
          on:click={handleClose}
          class="p-1.5 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <form on:submit|preventDefault={handleSave} class="p-6 space-y-4">
        <div>
          <label for="edit-link-tree-title" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Judul <span class="text-red-500">*</span>
          </label>
          <input
            id="edit-link-tree-title"
            type="text"
            data-testid="edit-link-tree-title-input"
            bind:value={title}
            placeholder="Contoh: Tautan Saya"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm"
            required
          />
        </div>

        <div>
          <label for="edit-link-tree-type" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Visibilitas
          </label>
          <select
            id="edit-link-tree-type"
            data-testid="edit-link-tree-type-select"
            bind:value={type}
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm"
          >
            <option value="public">Publik</option>
            <option value="unlisted">Tidak Terdaftar (Unlisted)</option>
            <option value="private">Privat</option>
          </select>
        </div>

        <div>
          <label for="edit-link-tree-description" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Deskripsi <span class="text-red-500">*</span>
          </label>
          <textarea
            id="edit-link-tree-description"
            data-testid="edit-link-tree-description-input"
            bind:value={description}
            rows="3"
            placeholder="Ceritakan singkat isi kumpulan tautan ini"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm"
            required
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            data-testid="cancel-edit-modal-btn"
            on:click={handleClose}
            disabled={loading}
            class="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            data-testid="submit-edit-modal-btn"
            disabled={loading}
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/25 transition-all disabled:opacity-60"
          >
            {#if loading}
              <LoaderCircle size={18} class="animate-spin" />
              <span>Menyimpan...</span>
            {:else}
              <Save size={18} strokeWidth={2.5} />
              <span>Simpan Perubahan</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
