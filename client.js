window.__ModuleLoader__.load({
	id: "balance-card",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		var React = require("react");

		const css = [
			".dsb-card{position:fixed;top:16px;right:16px;z-index:60;box-sizing:border-box;padding:10px 14px 11px;border-radius:14px;pointer-events:auto;user-select:none;-webkit-user-select:none;",
			"background:linear-gradient(135deg,rgba(255,255,255,0.13) 0%,rgba(255,255,255,0.05) 50%,rgba(255,255,255,0.09) 100%);",
			"backdrop-filter:blur(28px) saturate(170%) brightness(1.05);-webkit-backdrop-filter:blur(28px) saturate(170%) brightness(1.05);",
			"border:1px solid rgba(255,255,255,0.14);",
			"box-shadow:0 10px 34px rgba(0,0,0,0.3),0 0 16px rgba(120,170,255,0.10),inset 0 1px 0 rgba(255,255,255,0.28);",
			"color:#eef1f8;cursor:grab;",
			"transition:box-shadow .2s ease,border-color .2s ease;}",
			"@supports not ((backdrop-filter:blur(4px)) or (-webkit-backdrop-filter:blur(4px))){",
			".dsb-card{background:linear-gradient(135deg,rgba(23,31,58,0.55) 0%,rgba(17,24,46,0.5) 50%,rgba(13,19,38,0.55) 100%);}",
			"}",
			".dsb-card:hover{box-shadow:0 12px 40px rgba(0,0,0,0.35),0 0 24px rgba(120,170,255,0.18);border-color:rgba(255,255,255,0.2);}",
			".dsb-card.dsb-dragging{cursor:grabbing;}",
			".dsb-head{display:flex;align-items:center;gap:8px;margin-bottom:3px;}",
			".dsb-title{font-size:12px;font-weight:500;color:#f2f5fb;opacity:0.85;letter-spacing:0.2px;text-shadow:0 1px 2px rgba(0,0,0,0.25);white-space:nowrap;}",
			".dsb-refresh{margin-left:auto;width:20px;height:20px;border-radius:999px;border:1px solid rgba(255,255,255,0.16);background:rgba(255,255,255,0.08);color:#b8c1d8;cursor:pointer;display:grid;place-items:center;font-size:11px;line-height:1;padding:0;flex:none;}",
			".dsb-refresh:hover{color:#ffffff;background:rgba(255,255,255,0.18);}",
			".dsb-amount{font-size:22px;font-weight:600;letter-spacing:0.2px;line-height:1.2;font-variant-numeric:tabular-nums;color:#ffffff;text-shadow:0 1px 3px rgba(0,0,0,0.3);white-space:nowrap;}",
			".dsb-amount .dsb-cur{font-size:14px;font-weight:500;opacity:0.8;margin-right:4px;}"
		].join("\n");

		const tagId = "balance-card/styles";
		function ensureStyles() {
			if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
				const tag = document.createElement("style");
				tag.dataset.plugin = "balance-card";
				tag.dataset.pluginCss = tagId;
				tag.textContent = css;
				document.head.appendChild(tag);
			}
		}

		function formatAmount(value) {
			const amount = Number(value);
			if (!Number.isFinite(amount)) return "--";
			return amount.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
		}

		function BalanceCard() {
			const [data, setData] = React.useState(null);
			const [pos, setPos] = React.useState({ x: 0, y: 0 });
			const [dragging, setDragging] = React.useState(false);
			const dragRef = React.useRef(null);
			const cardRef = React.useRef(null);

			const load = React.useCallback(async function () {
				let res = null;
				try {
					const resp = await fetch("/api/balance-card", { cache: "no-store" });
					res = await resp.json();
				} catch (e) {
					setData(null);
					return;
				}
				if (res && res.ok) setData(res.data);
				else setData(null);
			}, []);

			React.useEffect(function () {
				load();
				const id = setInterval(load, 60000);
				return function () { clearInterval(id); };
			}, [load]);

			function clampPos(p, el) {
				const r = el.getBoundingClientRect();
				const xMin = -(window.innerWidth - r.width - 24);
				const yMax = Math.max(0, window.innerHeight - r.height - 24);
				return { x: Math.min(0, Math.max(xMin, p.x)), y: Math.min(yMax, Math.max(0, p.y)) };
			}

			function onPointerDown(e) {
				if (e.button !== 0) return;
				if (e.target && typeof e.target.closest === "function" && e.target.closest("button")) return;
				dragRef.current = { sx: e.clientX, sy: e.clientY, bx: pos.x, by: pos.y };
				setDragging(true);
				window.addEventListener("pointermove", onDragMove);
				window.addEventListener("pointerup", onDragUp);
				window.addEventListener("pointercancel", onDragUp);
			}
			function onDragMove(e) {
				const d = dragRef.current;
				if (!d) return;
				setPos({ x: d.bx + (e.clientX - d.sx), y: d.by + (e.clientY - d.sy) });
			}
			function onDragUp() {
				dragRef.current = null;
				setDragging(false);
				window.removeEventListener("pointermove", onDragMove);
				window.removeEventListener("pointerup", onDragUp);
				window.removeEventListener("pointercancel", onDragUp);
				const el = cardRef.current;
				if (el) setPos(function (p) { return clampPos(p, el); });
			}
			function onDoubleClick() {
				setPos({ x: 0, y: 0 });
			}

			return React.createElement("div", {
				className: "dsb-card" + (dragging ? " dsb-dragging" : ""),
				ref: cardRef,
				style: { transform: "translate(" + pos.x + "px, " + pos.y + "px)" },
				onPointerDown: onPointerDown,
				onDoubleClick: onDoubleClick,
				title: "\u62D6\u52A8\u79FB\u52A8\uFF0C\u53CC\u51FB\u590D\u4F4D"
			},
				React.createElement("div", { className: "dsb-head" },
					React.createElement("span", { className: "dsb-title" }, "DeepSeek \u4F59\u989D"),
					React.createElement("button", { className: "dsb-refresh", title: "\u5237\u65B0", type: "button", onClick: load }, "\u21BB")),
				React.createElement("div", { className: "dsb-amount" },
					React.createElement("span", { className: "dsb-cur" }, data && data.currency === "USD" ? "$" : "\u00A5"),
					data && data.total !== null && data.total !== undefined ? formatAmount(data.total) : "--")
			);
		}

		function apply(ctx) {
			ensureStyles();
			ctx.slots.inject("shell.overlay", () => ctx.slots.register(
				{ name: "shell.overlay", id: "deepseek-balance", order: 10 },
				() => React.createElement(BalanceCard)
			));
		}
		exports.apply = apply;
		exports.inject = ["slots"];
		return module.exports;
	}
});
