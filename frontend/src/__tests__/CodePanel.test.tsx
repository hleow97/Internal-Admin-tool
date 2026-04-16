import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CodePanel from "@/components/CodePanel";
import type { Code } from "@/lib/types";

const mockCodes: Code[] = [
  { id: "code-1", category: { id: "cat-1", name: "Travel" }, code: "TRV-001", description: "Domestic travel", is_active: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  { id: "code-2", category: { id: "cat-1", name: "Travel" }, code: "TRV-002", description: "", is_active: false, created_at: "2026-01-02T00:00:00Z", updated_at: "2026-01-02T00:00:00Z" },
];

const defaultProps = {
  categoryId: "cat-1",
  categoryName: "Travel",
  codes: mockCodes,
  loading: false,
  error: null,
  page: 1,
  totalPages: 1,
  totalCount: 2,
  showInactive: false,
  onSetPage: jest.fn(),
  onSetShowInactive: jest.fn(),
  onAddCode: jest.fn().mockResolvedValue(undefined),
  onUpdateCode: jest.fn().mockResolvedValue(undefined),
  onDismissError: jest.fn(),
};

describe("CodePanel", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows placeholder when no category selected", () => {
    render(<CodePanel {...defaultProps} categoryId={null} categoryName={null} />);
    expect(screen.getByText("Select a category to view its codes")).toBeInTheDocument();
  });

  it("renders code table with values and status badges", () => {
    render(<CodePanel {...defaultProps} />);
    expect(screen.getByText("TRV-001")).toBeInTheDocument();
    expect(screen.getByText("Domestic travel")).toBeInTheDocument();
    expect(screen.getByText("TRV-002")).toBeInTheDocument();
    expect(screen.getAllByText("Active").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Inactive").length).toBeGreaterThanOrEqual(2);
  });

  it("shows category name as subtitle", () => {
    render(<CodePanel {...defaultProps} />);
    expect(screen.getByText("Travel")).toBeInTheDocument();
    expect(screen.getByText("Expense Codes")).toBeInTheDocument();
  });

  it("shows empty state when no codes", () => {
    render(<CodePanel {...defaultProps} codes={[]} />);
    expect(screen.getByText("No codes in this category")).toBeInTheDocument();
  });

  it("opens add modal and submits new code", async () => {
    render(<CodePanel {...defaultProps} />);
    fireEvent.click(screen.getByText("+ Add"));

    expect(screen.getByRole("heading", { name: "Add Code" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Code"), { target: { value: "TRV-003" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "New code" } });
    fireEvent.submit(screen.getByLabelText("Code").closest("form")!);

    await waitFor(() => {
      expect(defaultProps.onAddCode).toHaveBeenCalledWith({ code: "TRV-003", description: "New code" });
    });
  });

  it("opens edit modal and submits update", async () => {
    render(<CodePanel {...defaultProps} />);
    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[0]);

    expect(screen.getByText("Edit Code")).toBeInTheDocument();
    expect(screen.getByDisplayValue("TRV-001")).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue("Domestic travel"), { target: { value: "Updated desc" } });
    fireEvent.click(screen.getByText("Update Code"));

    await waitFor(() => {
      expect(defaultProps.onUpdateCode).toHaveBeenCalledWith("code-1", {
        code: "TRV-001",
        description: "Updated desc",
        is_active: true,
        category: "cat-1",
        updated_at: "2026-01-01T00:00:00Z",
      });
    });
  });

  it("closes modal on cancel", () => {
    render(<CodePanel {...defaultProps} />);
    fireEvent.click(screen.getByText("+ Add"));
    expect(screen.getByLabelText("Code")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByLabelText("Code")).not.toBeInTheDocument();
  });

  it("shows error alert", () => {
    render(<CodePanel {...defaultProps} error="Server error" />);
    expect(screen.getByText("Server error")).toBeInTheDocument();
  });
});
