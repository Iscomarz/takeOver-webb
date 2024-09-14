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
    <br>
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
	font-size: clamp(1.5em, 5vw, 2.5em);
	padding: 0px;
	margin: 0px;
  }
  h4, p{
	font-family: "JostRegular";
  }
  h4{
	font-size: clamp(.8em, 3vw, 1.2em);
	margin-top: -10px;
  }

  p{
    font-size: clamp(.8em, 3vw, 1em);
  }
</style>