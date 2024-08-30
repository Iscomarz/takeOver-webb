<script>
export let titulo = 'Nombre del evento';
export let fecha = 'Dia del evento';
export let descripcion = 'Breve descripcion';
</script>

<div class="info-content">
    <div>
      <h2>{titulo}</h2>
      <h4>{fecha}</h4>
    </div>
    <p>
      {descripcion}
    </p>
</div>

<style>
  .info-content{
	width: 85%;
	padding: 20px;
	color: whitesmoke;
  }
  h2 {
    font-family: "JockeyOne";
	font-size: 2.5em;
	padding: 0px;
	margin: 0px;
  }
  h4, p{
	font-family: "JostRegular";
  }
  h4{
	font-size: 1.2em;
	margin-top: -10px;
  }
</style>