<script>
  import creditCardIcon from "$lib/images/icons/credit-card.svg";
  import visaIcon from "$lib/images/icons/visa.png";
  import masterIcon from "$lib/images/icons/mastercard.png";
  import googleIcon from "$lib/images/icons/google-pay.png";
  import appleIcon from "$lib/images/icons/apple-pay.png";
  import americanIcon from "$lib/images/icons/american-express.png";
  import samsungPay from "$lib/images/icons/samsung-pay.png";
</script>

<div class="content-footer">
  <p>ACEPTAMOS</p>
  <div class="payment-logos">
    <img src={visaIcon} alt="Visa" />
    <img src={masterIcon} alt="Mastercard" />
    <img src={americanIcon} alt="American Express" />
    <img src={appleIcon} alt="Apple Pay" />
    <img src={googleIcon} alt="Google Pay" />
    <img src={samsungPay} alt="Samsung Pay" />
  </div>
</div>

<style>
    .content-footer{
        display: flex;
        flex-direction: column;
        align-items: center;
    }
  p {
    text-align: center;
    font-family: "JostRegular";
    color: whitesmoke;
    font-size: clamp(0.8em, 3vw, 1em);
  }

  .payment-logos {
    display: grid;
    grid-template-columns: repeat(3, 1fr); /* 3 logos por fila */
    gap: 0.6rem; /* menos separación */
    justify-items: center;
    margin: 1rem 0;
    width: 50%;
  }

  .payment-logos img {
    width: 65px; /* un poco más pequeño */
    height: 40px;
    object-fit: contain;
    border-radius: 8px;
    background: #fff;
    padding: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  /* Ajustes para pantallas más pequeñas (ej. celulares) */
  @media (max-width: 600px) {
    .payment-logos {
      grid-template-columns: repeat(3, 1fr); /* sigue en 2 filas */
      gap: 0.4rem; /* menos espacio aún */
    }

    .payment-logos img {
      width: 55px;
      height: 35px;
      padding: 3px;
    }
  }
</style>
