import { convertCodeInterpreterToolToAdapterFormat } from "@tanstack/ai-openai/tools";
import { afterEach, expect, test, vi } from "vite-plus/test";

import {
  createSessionInterpreter,
  provisionSandbox,
  refreshSandbox,
} from "./sandbox.server";

afterEach(() => vi.unstubAllGlobals());

test("uploads the workspace to a network-disabled container", async () => {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ id: "cntr_test" }))
    .mockResolvedValueOnce(Response.json({ id: "cfile_test" }));
  vi.stubGlobal("fetch", fetchMock);

  const id = await provisionSandbox("test-only", "session-test", [
    {
      id: "source",
      path: "data/sales.csv",
      content: "month,revenue\nApril,300",
    },
  ]);

  expect(id).toBe("cntr_test");
  const createRequest = fetchMock.mock.calls[0]?.[1];
  expect(JSON.parse(String(createRequest?.body))).toEqual({
    name: "agentfluency-session-test",
    network_policy: { type: "disabled" },
  });
  const [url, request] = fetchMock.mock.calls[1] ?? [];
  expect(url).toBe("https://api.openai.com/v1/containers/cntr_test/files");
  if (!(request?.body instanceof FormData)) {
    throw new TypeError("Expected a multipart workspace upload.");
  }
  const upload = request.body.get("file");
  expect(upload).toBeInstanceOf(File);
  if (!(upload instanceof File)) {
    throw new TypeError("Expected a workspace archive.");
  }
  expect(upload.name).toBe("workspace.tar");
  const archive = await upload.text();
  expect(archive.slice(0, 9)).toBe("sales.csv");
  expect(archive.slice(345, 349)).toBe("data");
  expect(archive.slice(512, 535)).toBe("month,revenue\nApril,300");
});

test("cleans up the allocated container after a failed upload", async () => {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ id: "cntr_test" }))
    .mockResolvedValueOnce(new Response("", { status: 503 }))
    .mockResolvedValueOnce(Response.json({ deleted: true }));
  vi.stubGlobal("fetch", fetchMock);
  await expect(
    provisionSandbox("test-only", "session-test", [])
  ).rejects.toThrow("OpenAI sandbox upload failed (503).");
  expect(fetchMock.mock.calls[2]?.[0]).toBe(
    "https://api.openai.com/v1/containers/cntr_test"
  );
  expect(fetchMock.mock.calls[2]?.[1]?.method).toBe("DELETE");
});

test("reports container creation failures with the OpenAI request ID", async () => {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValue(
      Response.json(
        { error: { code: "invalid_value", param: "expires_after.minutes" } },
        { status: 400, headers: { "x-request-id": "req_12345678a" } }
      )
    );
  vi.stubGlobal("fetch", fetchMock);
  await expect(
    provisionSandbox("test-only", "session-test", [])
  ).rejects.toThrow(
    "OpenAI sandbox create failed (400). Request ID req_12345678a."
  );
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("refreshes the existing container without creating another one", async () => {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ id: "cntr_test" }));
  vi.stubGlobal("fetch", fetchMock);
  await refreshSandbox("test-only", "cntr_test");
  expect(fetchMock).toHaveBeenCalledWith(
    "https://api.openai.com/v1/containers/cntr_test",
    expect.objectContaining({ method: "GET" })
  );
});

test("TanStack AI sends the existing container ID as the tool container", () => {
  expect(
    convertCodeInterpreterToolToAdapterFormat(
      createSessionInterpreter("cntr_test")
    )
  ).toEqual({
    type: "code_interpreter",
    container: "cntr_test",
  });
});
