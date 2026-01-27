<script>
  export let texto = "Button";
  export let href = "#";
</script>

<a 
  href="/{href}"
  class="inline-flex items-center justify-center px-8 py-3 bg-white text-gray-900 rounded-xl text-base font-semibold font-jost cursor-pointer transition-all duration-300 hover:bg-white/90 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(255,255,255,0.3)] active:scale-95 uppercase tracking-wider no-underline"
>
  {texto}
</a>
