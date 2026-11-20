import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { classify, createAssistantServer } from "../../server/assistant.mjs";

const providerReply = (data) => Response.json({ output: [{
  type: "message", content: [{ type: "output_text", text: JSON.stringify(data) }],
}] });

test("selecciona solo claves permitidas y deshabilita el almacenamiento del proveedor", async () => {
  const result = await classify({ kind: "description", message: "Comidas congeladas para reventa" }, {
    key: "test-key", model: "test-model",
    fetcher: async (_url, request) => {
      const body = JSON.parse(request.body);
      assert.equal(body.store, false);
      assert.equal(body.text.format.strict, true);
      assert.equal(body.input, "Comidas congeladas para reventa");
      return providerReply({ clues: ["production", "production"] });
    },
  });
  assert.deepEqual(result, { clues: ["production"] });
  await assert.rejects(classify({ kind: "description", message: "Texto no confiable" }, {
    key: "test-key", model: "test-model", fetcher: async () => providerReply({ clues: ["9999"] }),
  }), /Invalid provider selection/);
});

async function withServer(options, run) {
  const server = createAssistantServer(options).listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    await run("http://127.0.0.1:" + server.address().port + "/api/crea-assistant");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("rechaza orígenes ajenos, identificadores, datos extra y peticiones sobre el límite", async () => {
  const origin = "https://crea.example";
  let forwarded = 0;
  await withServer({ origin, key: "test-key", model: "test-model",
    fetcher: async () => { forwarded++; return providerReply({ topic: "sales" }); },
  }, async (url) => {
    const submit = (body, from = origin) => fetch(url, { method: "POST", headers: { Origin: from, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    assert.equal((await submit({ question: "Cómo proyecto mis ventas" }, "https://other.example")).status, 403);
    assert.equal((await submit({ question: "Mi RUC es 11111111111" })).status, 400);
    assert.equal((await submit({ question: "Cómo proyecto mis ventas", answers: ["private"] })).status, 400);
    assert.equal((await submit({ question: "x".repeat(3000) })).status, 413);
    for (let i = 0; i < 4; i++) {
      assert.deepEqual(await (await submit({ question: "Cómo proyecto mis ventas" })).json(), { topic: "sales" });
    }
    assert.equal((await submit({ question: "Cómo proyecto mis ventas" })).status, 429);
    assert.equal(forwarded, 4);
  });
});

test("devuelve indisponibilidad para que el sitio mantenga la ayuda local", async () => {
  const origin = "https://crea.example";
  await withServer({ origin }, async (url) => {
    const response = await fetch(url, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" },
      body: JSON.stringify({ question: "Cómo se clasifican las cafeterías" }) });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("cache-control"), "no-store");
  });
});
