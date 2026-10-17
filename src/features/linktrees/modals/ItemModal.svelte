<script>
  import { Link2, Save, X, LoaderCircle } from "lucide-svelte";
  import { linkTreesStore } from "../states/linkTreesStore";
  import { showErrorDialog } from "../../../helpers/toolsHelper";

  export let show = false;
  export let linkTree = null;
  export let item = null;
  export let onClose = undefined;

  let loading = false;
  let label = "";
  let url = "";

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

  // Mode ubah: isi form dari item; mode tambah: form kosong.
  $: if (show) {
    label = item ? item.label || item.title || "" : "";
    url = item ? item.url || "" : "";
  }

  function onSuccess() {
    linkTreesStore.asyncSetLinkTree(linkTree.id);
    handleClose();
  }

  $: if ($linkTreesStore.isItemAdd) {
    loading = false;
    linkTreesStore.setIsItemAdd(false);
    if ($linkTreesStore.isItemAdded) {
      linkTreesStore.setIsItemAdded(false);
      onSuccess();
    }
  }

  $: if ($linkTreesStore.isItemChange) {
    loading = false;
    linkTreesStore.setIsItemChange(false);
    if ($linkTreesStore.isItemChanged) {
      linkTreesStore.setIsItemChanged(false);
      onSuccess();
    }
  }

  function handleSave() {
    if (!label.trim()) {
      showErrorDialog("Label tidak boleh kosong");
      return;
    }

    if (!/^https?:\/\/\S+$/i.test(url.trim())) {
      showErrorDialog("URL harus diawali http:// atau https://");
      return;
    }

    loading = true;
    if (item) {
      linkTreesStore.asyncSetIsItemChange(linkTree.id, item.id, label.trim(), url.trim());
    } else {
      linkTreesStore.asyncSetIsItemAdd(linkTree.id, label.trim(), url.trim());
    }
  }
</script>

{#if show && linkTree}
  <div
    data-testid="item-modal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
  >
    <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
            <Link2 size={18} strokeWidth={2.5} />
          </div>
          <h2 data-testid="item-modal-title" class="text-base font-bold text-slate-800">
            {item ? "Ubah Item Tautan" : "Tambah Item Tautan"}
          </h2>
        </div>
        <button
          type="button"
          data-testid="close-item-modal-btn"
          aria-label="Tutup"
          on:click={handleClose}
          class="p-1.5 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <form on:submit|preventDefault={handleSave} class="p-6 space-y-4">
        <div>
          <label for="item-label" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Label <span class="text-red-500">*</span>
          </label>
          <input
            id="item-label"
            type="text"
            data-testid="item-label-input"
            bind:value={label}
            placeholder="Contoh: GitHub"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm"
            required
          />
        </div>

        <div>
          <label for="item-url" class="block text-sm font-semibold text-slate-700 mb-1.5">
            URL <span class="text-red-500">*</span>
          </label>
          <input
            id="item-url"
            type="url"
            data-testid="item-url-input"
            bind:value={url}
            placeholder="https://github.com/username"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm"
            required
          />
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            data-testid="cancel-item-modal-btn"
            on:click={handleClose}
            disabled={loading}
            class="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            data-testid="submit-item-modal-btn"
            disabled={loading}
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/25 transition-all disabled:opacity-60"
          >
            {#if loading}
              <LoaderCircle size={18} class="animate-spin" />
              <span>Menyimpan...</span>
            {:else}
              <Save size={18} strokeWidth={2.5} />
              <span>Simpan Item</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
