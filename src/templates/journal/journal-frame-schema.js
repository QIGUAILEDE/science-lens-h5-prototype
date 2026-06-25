export const JOURNAL_FRAME_SCHEMA = {
  id: "JOURNAL_FRAME_BIO_01",
  name: "生物学期刊封面",
  type: "journal-frame",
  canvas: {
    aspectRatio: "3:4"
  },
  imageSlots: [
    {
      id: "main-image",
      x: 0.08,
      y: 0.16,
      width: 0.84,
      height: 0.68,
      mask: "rectangle"
    }
  ],
  textSlots: [
    { id: "journal-name", editable: true },
    { id: "title", editable: true },
    { id: "author", editable: true },
    { id: "issue", editable: true }
  ],
  decorations: [],
  export: {
    transparentSupported: true
  }
};

