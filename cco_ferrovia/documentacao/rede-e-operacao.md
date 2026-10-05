# Rede e operação do CCO

## Rede Wi-Fi usando o notebook

O notebook pode criar o ponto de acesso usado pelas locomotivas. Configure o **Hotspot móvel** do Windows em 2,4 GHz com o nome `CCO_FERROVIA` e uma senha própria. Copie exatamente esses dados para o arquivo `secrets.h` antes de gravar cada ESP-12E.

No primeiro uso, permita o acesso do Python em redes privadas quando o Firewall do Windows perguntar. O CCO usa a porta UDP 4210 para receber telemetria, UDP 4211 para comandos das locomotivas e HTTP local 8080 para a tela.

O navegador não conversa diretamente com as locomotivas. O serviço local do CCO recebe os comandos da tela, comunica-se com o Arduino pelo cabo USB e com os ESP-12E pelo Wi-Fi.

## Sequência de início do turno

1. Energizar a fonte de 5 V da via e verificar se os dois semáforos combinados iniciam vermelhos.
2. Ligar o hotspot do notebook.
3. Ligar as locomotivas e aguardar a indicação de Wi-Fi na tela.
4. Executar `INICIAR_SISTEMA.cmd`.
5. Informar o nome do aluno operador e iniciar o turno.
6. Selecionar a rota e confirmar a posição inicial de cada locomotiva em um sensor visível.
7. Movimentar inicialmente uma locomotiva por vez e conferir a sequência dos sensores.
8. Somente depois liberar a segunda locomotiva. A terceira deve permanecer parada como reserva.

## Comportamentos de segurança

- Uma locomotiva sem posição confirmada não recebe comando de movimento.
- No máximo duas locomotivas podem ficar em movimento.
- Se um sensor esperado for pulado, a locomotiva para e sua posição passa a ser incerta.
- Três falhas consecutivas deixam o sensor marcado como `FALHA`.
- Se a comunicação Wi-Fi for perdida, o próprio ESP-12E para o motor.
- Se a comunicação com o computador for perdida, o Arduino coloca os dois semáforos combinados em vermelho.
- Chaves próximas a um sensor ativo não são movimentadas pelo Arduino.
- A parada na oficina é temporizada e exige confirmação visual porque não há sensor dentro dela.

## Encerramento

1. Parar todas as locomotivas.
2. Usar o comando `Encerrar turno`.
3. Abrir o relatório e imprimir ou salvar em PDF.
4. Desligar as locomotivas, depois a fonte da via e por último o hotspot.
