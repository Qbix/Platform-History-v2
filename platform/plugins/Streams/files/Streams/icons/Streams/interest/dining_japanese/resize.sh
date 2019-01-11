#! /bin/bash

for i in 40 50 80; do convert -resize "$i"x"$i" sushi.jpeg $i.png; done

convert -resize 500x sushi.jpeg 500x.png
convert -resize x100 sushi.jpeg x100.png
